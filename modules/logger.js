// This is a customized logger write logs into database.

var mysql = require('mysql');
var onFinished = require('on-finished');
var http = require('http');

var local_db_config = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'local(*)DB2015',
    database: 'localdb'
};
var server_db_config = {
    host: '10.0.16.16',
    port: '4066',
    user: 'Qyabhio9',
    password: 'FRg7kpmbSzOX',
    database: 'jackq201m_mysql_galddzuv'
};

var database = mysql.createConnection(process.env["NODE_LOCAL_DEBUG_MODE"] === '1'?local_db_config:server_db_config);

var cfg = {
    verbose: true,
    debug: true,
    error: true,
};

var verbose = function (msg) {
    cfg.verbose?console.log('LOGGER ', 'VERBOSE ', msg):'';
};

var debug = function (msg) {
    cfg.debug?console.log('LOGGER ', 'DEBUG   ', msg):'';
};

var error = function (msg) {
    cfg.error?console.log('LOGGER ', 'ERROR   ', msg):'';
};

// part of source code from morgan (https://github.com/expressjs/morgan)
var getVar = {
    url: function (req) {
        return req.originalUrl || req.url;
    },
    method: function (req) {
        return req.method;
    },
    referer: function (req) {
        return req.headers['referer'] || req.headers['referrer'];
    },
    ip: function (req) {
        return (req.connection && req.connection.remoteAddress) 
            || req._remoteAddress 
            || req.ip 
            || '';
    },
    userAgent: function (req) {
        return req.headers["user-agent"] || "";
    }
}

module.exports = function (debugMode) {
    debugMode = debugMode || false;
    database.query('CREATE TABLE IF NOT EXISTS `review_2014` ( ' 
        + '`id` INTEGER PRIMARY KEY AUTO_INCREMENT, ' 
        + '`time` TIMESTAMP NOT NULL, ' 
        + '`ip` TEXT,' 
        + '`user_agent` TEXT,' 
        + '`referer` TEXT,' 
        + '`page_url` TEXT,' 
        + '`http_status_code` TEXT,' 
        + '`render_time` TEXT, ' 
        + '`response_type` TEXT, ' 
        + '`geo_country` TEXT,' 
        + '`geo_area` TEXT,' 
        + '`geo_region` TEXT,' 
        + '`geo_city` TEXT,' 
        + '`geo_county` TEXT,' 
        + '`geo_isp` TEXT)', function (err) {
        if (err) {
            error("database can't be created.");
            return;
        }
        verbose('Logger database prepared!');
    });
    return function (req, res, next) {
        var startTime = new Date();
        var data = {
            ip: getVar.ip(req),
            userAgent: getVar.userAgent(req),
            referer: getVar.referer(req),
            pageUrl: getVar.url(req),
            httpStatusCode: "",
            renderTime: "",
            responseType: ""
        };
        onFinished(res, function (err) {
            data.httpStatusCode = res.statusCode || '';
            data.renderTime = (new Date() - startTime).toString();
            data.responseType = res._headers['content-type'] || '';
            
            http.get("http://ip.taobao.com/service/getIpInfo.php?ip=" + data.ip, function (res) {
                res.on('data', function (ipData) {
                    ipData = JSON.parse(ipData);
                    if (ipData && ipData.code === 0) {
                        database.query('insert into `review_2014` (' 
                    + ' `time`,`ip`,`user_agent`, `referer`, `page_url`, `http_status_code`, `render_time`, `response_type`,' 
                    + ' `geo_country`, `geo_area` , `geo_region` , `geo_city` , `geo_county` , `geo_isp` ' 
                    + ' ) values (' 
                    + ' now(), ? , ? , ? , ? , ? , ? , ? ' 
                    + ' , ? , ? , ? , ? , ? , ?' 
                    + ')', [
                            data.ip, data.userAgent, data.referer, data.pageUrl, 
                            data.httpStatusCode, data.renderTime, data.responseType,
                            ipData.data.country, ipData.data.area, ipData.data.region,
                            ipData.data.city, ipData.data.county, ipData.data.isp,
                        ], function (err) {
                            if (err) {
                                error("insert log:" + err.toString());
                            } else {
                                verbose("database finished correctly! (With server data)");
                            }
                        });
                        return;
                    }
                    database.query('insert into `review_2014` (' 
                    + ' `time`,`ip`,`user_agent`, `referer`, `page_url`, `http_status_code`, `render_time`, `response_type` ' 
                    + ' ) values (' 
                    + ' now(), ? , ? , ? , ? , ? , ? , ? ' 
                    + ')', [
                        data.ip, data.userAgent, data.referer, data.pageUrl, 
                        data.httpStatusCode, data.renderTime, data.responseType
                    ], function (err) {
                        if (err) {
                            error("insert log:" + err.toString());
                        } else {
                            verbose("database finished correctly!");
                        }
                    });
                });
            }).on('error', function (e) {
                database.query('insert into `review_2014` (' 
                + ' `time`,`ip`,`user_agent`, `referer`, `page_url`, `http_status_code`, `render_time`, `response_type` ' 
                + ' ) values (' 
                + ' now(), ? , ? , ? , ? , ? , ? , ? ' 
                + ')', [
                    data.ip, data.userAgent, data.referer, data.pageUrl, 
                    data.httpStatusCode, data.renderTime, data.responseType
                ], function (err) {
                    if (err) {
                        error("insert log:" + err.toString());
                    } else {
                        verbose("database finished correctly!");
                    }
                });
            });

            
        });
        next();
    };
}