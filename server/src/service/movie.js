import _ from 'underscore'
import MovieModel from '../models/movie'
import AakModel from '../models/aka'
import AkaWithOtherModel from '../models/akaWithOther'
import LanguageModel from '../models/language'
import { db } from '../db';
import PubFunction from '../common/publicFunc'
import BusinessException from '../common/businessException'
import { QueryDefaultOptions } from '../common/commonSetting'
import { PageResult } from '../common/type';
import BaseService from './baseService';
import Condition from '../db/condition';

const rebuildKeys = {
    countrys: 1,
    akas: 1,
    publishdates: 1,
    languages: 1,
    types: 1,
    actors: 1,
    writers: 1,
    directors: 1
}
  
const rebuildMovie = (movie) => {
    for (const key in movie) {
        if (rebuildKeys[key]) {
            const item = movie[key];
            item && (movie[key] = item.split('&&'))
        }
    }
    return movie;
}

/**
 * 电影模块service
 */
export default class MovieService extends BaseService{
    /**
     * 根据条件查询电影
     * @param condition 查询字段对象
     */
    async getMoviesByCondition(condition: {
        id?: number,
        name?: string,
        startYear?: number,
        endYear?: number,
        language?: number,

    } = {}, offset = 0, pageSize = QueryDefaultOptions.pageSize) : Promise<PageResult> {
        let hasWhere = false;
        for (const key in condition) {
            if(condition[key]){
                hasWhere = true;
                break;
            }
        }
        const sql = `SELECT DISTINCT
            movie. NAME AS title,
            movie.doubanMovieId,
            movie.picture,
            movie. YEAR as \`year\`,
            movie.summary,
            movie.movieId AS _id,
            (
                SELECT GROUP_CONCAT(c.countryName SEPARATOR '&&') from country c
                LEFT JOIN countrymovie cm on cm.countryId = c.countryId
                WHERE cm.movieId = movie.movieId
            ) as countrys,
            (
                SELECT GROUP_CONCAT(aka.akaName SEPARATOR '&&') from aka
                LEFT JOIN akawithother ao on ao.akaId = aka.akaId
                WHERE ao.otherId = movie.movieId
            ) as akas,
            (
                SELECT GROUP_CONCAT(p.publishDate SEPARATOR '&&') from publishdate p
                WHERE p.movieId = movie.movieId
            ) as publishdates,
            (
                SELECT GROUP_CONCAT(l.languageName SEPARATOR '&&') from \`language\` l
                LEFT JOIN languagemovie lm on lm.languageId = l.languageId
                WHERE lm.movieId = movie.movieId${condition.language ? ' and l.languageId = :language' : ''}
            ) as languages,
            (
                SELECT GROUP_CONCAT(t.typeName SEPARATOR '&&') from type t
                LEFT JOIN movietype mt on mt.typeId = t.typeId
                WHERE mt.movieId = movie.movieId
            ) as types,
            ( SELECT GROUP_CONCAT(DISTINCT a.\`name\` SEPARATOR '&&')
                FROM artistmovie am				
                LEFT JOIN artist a ON am.artistId = a.artistId
                LEFT JOIN artistjob aj ON aj.artistId = a.artistId
                WHERE am.movieId = movie.movieId and aj.jobId = 1
            ) as actors,
            ( SELECT GROUP_CONCAT(DISTINCT a.\`name\` SEPARATOR '&&')
                FROM artistmovie am				
                LEFT JOIN artist a ON am.artistId = a.artistId
                LEFT JOIN artistjob aj ON aj.artistId = a.artistId
                WHERE am.movieId = movie.movieId and aj.jobId = 2
            ) as writers,
            ( SELECT GROUP_CONCAT(DISTINCT a.\`name\` SEPARATOR '&&')
                FROM artistmovie am				
                LEFT JOIN artist a ON am.artistId = a.artistId
                LEFT JOIN artistjob aj ON aj.artistId = a.artistId
                WHERE am.movieId = movie.movieId and aj.jobId = 3
            ) as directors
        FROM
            movie
        ${hasWhere ? `where 
            ${condition.id ? ' movie.movieId = :id' : ''}
            ${condition.name ? ' and movie.name like \':name%\'' : ''}
            ${condition.startYear ? ' and movie.year >= :startYear' : ''}
            ${condition.endYear ? ' and movie.year <= :endYear' : ''}`
        : ''}
        limit ${offset}, ${pageSize}`;
        const totalResult = await db.query('select count(*) as total from movie', {type: db.QueryTypes.SELECT});
        const {total} = totalResult[0];
        let result = await db.query(sql, {
            type: db.QueryTypes.SELECT,
            replacements: condition
        });
        result = result.map((movie) => {
            return rebuildMovie(movie);
        })
        return {total, result}
    }

    /**
     * 根据id 获取电影
     * @param movieId 电影id
     */
    async getMovieById(movieId: number) : Promise<MovieModel> {        
        if(!movieId){
            throw new BusinessException('电影id不能为空');
        }
        return await MovieModel.findOne({
            where:{
                movieId: movieId
            }
        });
    }

    /**
     * 根据id 获取电影详细信息
     * @param movieId 电影id
     */
    async getMovieDetailById(movieId: number) : Promise<MovieModel> {        
        if(!movieId){
            throw new BusinessException('电影id不能为空');
        }
        const {result} = await this.getMoviesByCondition({id: movieId})
        return result;
    }

    /**
     * 根据电影id删除电影
     * @param movieId 电影id
     */
    async deleteMovieById(movieId: number) : Promise<boolean> {
        if(!movieId){
            throw new BusinessException('电影id不能为空');
        }
        const result = await db.query('delete from movie where movieId = :id', {
            replacements:{
                id: parseInt(movieId)
            }
        })
        const {affectedRows} = result[1];
        return affectedRows > 0;
    }

    /**
     * 保存或者修改电影
     * @param movie 电影信息
     */
    async saveOrUpdateMovie(movie: MovieModel) : Promise<MovieModel> {
        //修改
        if(movie.movieId){
            movie.updateAt = Date.now();
            const originModel = await this.getMovieById(movie.movieId);
            if(!originModel){
                throw new BusinessException(`电影'${movie.movieId}'不存在`);
            }
            movie = await originModel.update(movie);
        }else{
            movie = await MovieModel.create(movie)
        }
        return movie;
    }
    /**
     * 获取电影统计分类信息
     * @param {*} key 分组的字段
     * @param {*} whereArray 筛选条件
     */
    async getMoviesByGroup(key: string = '', whereArray: [{key: string, value: any}]) : Promise<[{count: number, group: string}]>{
        const groups = {
            year: {
                groupKey: 'year',
                select: 'year'
            },
            language: {
                groupKey: 'l.languageId',
                select: 'l.languageName'
            },
            country: {
                groupKey: 'c.countryId',
                select: 'c.countryName'
            }
        }
        const group = groups[key]
        if(!group){
            throw new BusinessException(`不支持字段${key}的分组`);
        }
        const whereStr = whereArray.map((item) => {
            return `${item.key} = :${item.key}`
        }).join(', ');
        const whereReplacements = whereArray.map((item) => {
            return {
                [item.key]: item.value
            }
        }).join(', ');
        const sql = `select count(movie.movieId) as count, ${group.select} as \`${key}\`  from movie 
            left join languagemovie AS lm ON lm.movieId = movie.movieId
            left join LANGUAGE AS l ON l.languageId = lm.languageId
            left join countrymovie AS cm ON cm.movieId = movie.movieId
            left join country AS c ON c.countryId = cm.countryId
            ${whereStr ? `where ${whereStr}` : ''}
            group by ${group.groupKey}`;
        return await db.query(sql, {
            type: db.QueryTypes.SELECT,
            replacements: whereReplacements
        });
    }

    /**
     * 获取所有的语言信息
     */
    async getLanguage(){
        return await LanguageModel.findAll();
    }
}