const mysql = require('mysql')
const pool  = mysql.createPool({
  host     : '47.100.239.163',   // 数据库地址
  user     : 'manage',    // 连接名
  password : '123456',   // 数据库密码
  database : 'manage'  // 数据库名
})

class Mysql {
    constructor () {
 
    }
    query (sql) {
      return new Promise((resolve, reject) => {
        pool.query(sql, function (error, results, fields) {
            if (error) {
                throw error
            };
            resolve(results)
            // console.log('The solution is: ', results[0].solution);
        });
      })
       
    }
}
 
module.exports = new Mysql()