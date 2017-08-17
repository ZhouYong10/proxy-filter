/**
 * Created by Administrator on 2017/8/17 0017.
 */
var http = require('http');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var cheerio = require('cheerio');
var title;
var readNum;
var likeNum;

function postResult(uri, param, opts) {
    return new Promise(function (resolve, reject) {
        if (!opts) {
            opts = {};
        }
        if (opts.hasOwnProperty('form-data') && !opts['form-data']) {
            var postData = param;
        } else {
            var postData = querystring.stringify(param);
        }
        var option        = url.parse(uri);
        option['method']  = 'POST';
        option['headers'] = {
            'Content-Type':   'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
        if (opts.hasOwnProperty('headers')) {
            for (var i in opts['headers']) {
                option['headers'][i] = opts['headers'][i];
            }
        }
        if (option['protocol'] == 'http:') {
            var p = http;
        } else {
            var p = https;
        }
        var req = p.request(option, function (res) {
            //debug('STATUS: ' + res.statusCode);
            //debug('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function (chunk) {
                //console.log(chunk);
                body = body + chunk;
            });
            res.on('end', function () {
                //debug(body);
                resolve(body);
            });
            res.on('error', function (e) {
                reject(e);
            });
        });
        req.on('error', function (e) {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}


module.exports = {
    summary: 'a rule to modify response',
    *beforeSendResponse(requestDetail, responseDetail) {
        if(/mp\.weixin\.qq\.com\/s\?/i.test(requestDetail.url)) {
            try{
                console.log('来获取文章的标题吧---------------------');
                var $ = cheerio.load(responseDetail.response.body);
                title = $('#activity-name').text().trim();
            }catch(e){
                console.log('获取文章标题失败：', e);
            }
        }
        if(/mp\/getappmsgext/i.test(requestDetail.url)){
            try{
                console.log('来获取文章的阅读数吧=================================');
                var json_result = JSON.parse(responseDetail.response.body.toString());
                readNum = json_result.appmsgstat.read_num;
                likeNum = json_result.appmsgstat.like_num;
            }catch(e){
                console.log('获取阅读数失败：', e);
            }
        }

        if(title && readNum && likeNum) {
            console.log('文章标题：', title);
            console.log('文章阅读数：', readNum);
            console.log('文章点赞数：', likeNum);
            postResult('http://192.168.1.109:3000/proxy/wx/title/and/read/num', {
                title: title,
                readNum: readNum,
                likeNum: likeNum
            }).then(function (result) {
                console.log(result, '========================');
                console.log('上传文章标题，阅读数，点赞数成功！');
                title = null;
                readNum = null;
                likeNum = null;
            });
        }

        return null;
    }
};