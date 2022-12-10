const router = require("koa-router")();
var utility = require("utility");
const path = require("path");
var newfileName = "";
const koaBody = require("koa-body")({
  multipart: true, // 允许上传多个文件,不设置的话可能会导致读不到body区域数据
  formidable: {
    maxFileSize: 2 * 1024 * 1024, // 设置上传文件大小最大限制，默认2M
    uploadDir: path.join(__dirname, "./public/images"), // 上传的文件存储的路径
    keepExtensions: true, //  保存图片的扩展名
    onFileBegin: (name, file) => {
      var fileName = file.path;
      console.log(fileName);
      newfileName = fileName.split("\\")[2]; //只有在window操作系统中，文件路径为 \ 所以在上传代码时，注意换下
      // newfileName = fileName.split('/')[2]; 在Linux操作系统中，文件路径为 /
    },
  },
});

const mysql = require("./mysql");
//增删改查
router.post("/add", async (ctx, next) => {
  const postData = ctx.request.body;
  let { user_name, password, authority } = postData;
  await mysql.query(
    `INSERT INTO USER (user_name,password,authority) VALUES ('${user_name}',MD5('${password}'),'${authority}');`
  );
  ctx.body = {
    code: 200,
  };
});

router.delete("/delete", async (ctx, next) => {
  const postData = ctx.request.body;
  let { id } = postData;
  await mysql.query(`DELETE FROM USER WHERE id='${id}';`);
  ctx.body = {
    code: 200,
  };
});

router.put("/update", async (ctx, next) => {
  const postData = ctx.request.body;
  let { id, user_name, authority } = postData;
  await mysql.query(
    `UPDATE USER SET user_name='${user_name}', authority=${authority} WHERE id=${id};`
  );
  ctx.body = {
    code: 200,
  };
});

router.get("/user", async (ctx) => {
  let data = await mysql.query("SELECT * FROM USER;");
  ctx.body = {
    code: 200,
    data: data,
  };
});

//与业务相关

let accessToken = "init_s_token"; //短token
let refreshToken = "init_l_token"; //长token

/* 5s刷新一次短token */
setInterval(() => {
  accessToken = "s_tk" + Math.random();
}, 5000);

/* 24小时刷新一次长token */
setInterval(() => {
  refreshToken = "l_tk" + Math.random();
}, 86400000);

/* *
@param returncode 不为0请求异常，为104代表token过期 
*/

/* 登录接口获取长短token */
router.get("/getToken", async (ctx) => {
  ctx.body = {
    returncode: 0,
    accessToken,
    refreshToken,
  };
});

router.get("/getData", async (ctx) => {
  let { authorization } = ctx.headers;
  if (authorization !== accessToken) {
    ctx.body = {
      returncode: 104,
      info: "token过期",
    };
  } else {
    ctx.body = {
      code: 200,
      returncode: 0,
      data: { id: Math.random() },
    };
  }
});

router.get("/refresh", async (ctx) => {
  //接收的请求头字段都是小写的
  let { pass } = ctx.headers;
  console.log("pass", pass);
  if (pass !== refreshToken) {
    ctx.body = {
      returncode: 108,
      info: "长token过期，重新登录",
    };
  } else {
    ctx.body = {
      returncode: 0,
      accessToken,
    };
  }
});

const userList = [];
//收集用户信息
router.get("/getUserInfo", async (ctx) => {
  let { data } = ctx.query;
  userList.push(data);
  console.log(userList);
  ctx.body = {};
});

router.post("/trackweb", async (ctx) => {
  let data = ctx.request.body;
  userList.push(JSON.stringify(data));
  console.log(userList);
  ctx.body = {};
});

//登录页面

//登录(post请求需要koaBody)
router.post("/login", koaBody, async (ctx) => {
  console.log(ctx.request.body);
  let newData = ctx.request.body;
  let { userName, passWord } = newData;
  let md5_password = utility.md5(passWord);
  let data = await mysql.query(
    `SELECT * FROM USER WHERE user_name='${userName}';`
  );
  let Data = JSON.parse(JSON.stringify(data));
  if (Data.length !== 0) {
    Data.map((item) => {
      if (item.password == md5_password) {
        if (userName == "一叶扁舟") {
          ctx.body = {
            auth: [
              "firstItem",
              "fleet",
              "fileUp",
              "pdf",
              "baseEcharts",
              "baseTable",
              "flowChart",
              "magnifying",
              "drag",
              "I18n",
              "chatRoom",
              "manage",
            ],
            value: "di5j8fy85vSAX88U",
          };
        } else {
          ctx.body = {
            auth: [
              "firstItem",
              "fleet",
              "fileUp",
              "pdf",
              "baseEcharts",
              "baseTable",
              "flowChart",
              "magnifying",
              "drag",
              "I18n",
              "chatRoom",
            ],
            value: "di5j8fy85vSAX88U",
          };
        }
        ctx.status = 200;
      } else {
        ctx.status = 400;
      }
    });
  } else {
    ctx.status = 401;
  }
});
function isJSON(str) {
  if (typeof str == "string") {
    try {
      var obj = JSON.parse(str);
      if (typeof obj == "object" && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log("error：" + str + "!!!" + e);
      return false;
    }
  }
  console.log("It is not a string!");
}
//注册
router.post("/register", async (ctx) => {
  console.log(ctx.request.body);
  let newData = ctx.request.body;
  if (isJSON(newData)) {
    newData = JSON.parse(newData);
  }
  let { userName, passWord, authority, createTime, photo } = newData;
  let data = await mysql.query(
    `SELECT * FROM USER WHERE user_name='${userName}';`
  );
  let Data = JSON.parse(JSON.stringify(data));
  if (Data.length == 0) {
    await mysql.query(
      `INSERT INTO USER (user_name,password,authority,createTime,photo) VALUES ('${userName}',MD5('${passWord}'),'${authority}','${createTime}','${photo}');`
    );
    ctx.body = {
      message: "注册成功",
    };
  } else {
    ctx.status = 403;
    ctx.body = {
      message: "用户名已存在",
    };
  }
});

//用户管理页面
//查所有用户
router.get("/user", async (ctx) => {
  let data = await mysql.query(`SELECT * FROM USER';`);
  let Data = JSON.parse(JSON.stringify(data));
  ctx.body = {
    Data,
  };
});

//查单条用户
router.get("/getUser", async (ctx) => {
  let { user_name } = ctx.query;
  let data = await mysql.query(
    `SELECT createTime FROM USER WHERE user_name='${user_name}';`
  );
  let Data = JSON.parse(JSON.stringify(data));
  ctx.body = {
    Data,
    code: 200,
  };
});

//删除普通用户
router.delete("/deleteUser", async (ctx) => {
  let { id } = ctx.query;
  await mysql.query(`DELETE FROM USER WHERE id='${id}';`);
  ctx.body = {
    code: 200,
  };
});
//修改用户信息
router.put("/updateUser", async (ctx) => {
  let newData = ctx.request.body;
  if (isJSON(newData)) {
    newData = JSON.parse(newData);
  }
  let { id, user_name, password } = newData;
  await mysql.query(
    `UPDATE USER SET user_name='${user_name}', password=MD5('${password}') WHERE id=${id};`
  );
  ctx.body = {
    code: 200,
  };
});

//获取上传图片
router.post("/uploadImage", koaBody, async (ctx) => {
  // const file = ctx.request.files.file; // 获取上传文件
  // let {authorization} = ctx.headers;
  let { user_name } = ctx.request.body;
  await mysql.query(
    `UPDATE USER SET photo='${newfileName}' WHERE user_name='${user_name}';`
  );
  ctx.body = {
    code: 200,
    message: "上传成功",
  };
});

//将上传的图片返回给前端
router.get("/getImage", async (ctx) => {
  let { user_name } = ctx.query;
  let data = await mysql.query(
    `SELECT photo FROM USER WHERE user_name='${user_name}';`
  );
  let Data = JSON.parse(JSON.stringify(data));
  ctx.body = {
    Data,
    code: 200,
  };
});

let id = 3;
let data = [
  {
    name: "张三",
    tel: "13000000000",
    id: 1,
  },
  {
    name: "李四",
    tel: "13000000001",
    id: 2,
  },
  {
    name: "王五",
    tel: "13000000002",
    id: 3,
  },
];
router.get("/contactList", async (ctx) => {
  ctx.body = {
    code: 200,
    data: data,
  };
});
//form-data
router.post("/contact/new/form", koaBody, async (ctx) => {
  let newData = ctx.request.body;
  id++;
  newData.id = id;
  data.push(newData);
  ctx.body = {
    code: 200,
    data: data,
  };
});
//json
router.post("/contact/new/json", async (ctx) => {
  let newData = ctx.request.body;
  id++;
  newData.id = id;
  data.push(newData);
  ctx.body = {
    code: 200,
    data: data,
  };
});

router.put("/contact/edit", async (ctx) => {
  let newData = ctx.request.body;
  data.map((item, index) => {
    if (item.id == newData.id) {
      data[index] = newData;
    }
  });
  ctx.body = {
    code: 200,
    data: data,
  };
});
router.patch("/contact/edit", async (ctx) => {
  let newData = ctx.request.body;
  data.map((item, index) => {
    if (item.id == newData.id) {
      data[index] = newData;
    }
  });
  ctx.body = {
    code: 200,
    data: newData,
  };
});
function getQueryVariable(url, variable) {
  var query = url.split("?")[1];
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}
router.del("/contact", async (ctx) => {
  let id = getQueryVariable(ctx.request.url, "id");
  data = data.filter((item) => item.id != id);
  ctx.body = {
    code: 200,
    message: "删除成功",
  };
});

module.exports = router;
