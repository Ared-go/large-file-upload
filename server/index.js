const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
// https://www.npmjs.com/package/multiparty#readme 解析请求类型为 multipart/form-data格式的请求
const multiparty = require("multiparty");
const SparkMd5 = require("spark-md5");
const path = require("path");

console.log(path.resolve(__dirname, "../"), "dir path name ===> ");
const app = express(),
  PORT = 3000,
  HOST = "http://127.0.0.1",
  HOST_NAME = `${HOST}:${PORT}`;

app.listen(PORT, () => {
  console.log(
    `the web service is created successfully and is listening to the port: ${PORT}, you can visit ${HOST_NAME}`
  );
});

// 解决跨域
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// parse application/x-www-form-urlencoded post请求的表单提交格式
// post 请求 multipart/form-data格式不会对参数编码
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "1024mb",
  })
);
const delay = (time = 500) => {
  typeof time !== "number" ? (time = 500) : time;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
const isExistHandle = (path) => {
  return new Promise((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) return resolve(false);
      resolve(true);
    });
  });
};
const writeFile = (res, path, file, filename, stream) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, file, (err) => {
      if (err) {
        reject(err);
        res.send({
          code: 1,
          codeText: "文件上传失败",
        });
        return;
      }
      resolve();
      res.send({
        code: 0,
        codeText: "文件上传成功",
        originalFilename: filename,
        servicePath: path.replace(basePath, HOST_NAME),
      });
    });
  });
};
const uploadDir = `${__dirname}/server/upload`;
const basePath = path.resolve(__dirname, "../");
const multipart_upload = (req, auto) => {
  typeof auto !== "boolean" ? (auto = false) : null;
  let config = {
    maxFieldsSize: 200 * 1024 * 1024,
  };
  // auto 为true 自动上传文件
  if (auto) config.uploadDir = uploadDir;
  return new Promise(async (resolve, reject) => {
    await delay();
    // 解析form-data
    new multiparty.Form(config).parse(req, function (err, fields, files) {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        fields,
        files,
      });
    });
  });
};

// 单文件上传 [FORM-DATA]
app.post("/upload_single", async (req, res) => {
  try {
    console.log("触发接口");
    let { fields, files } = await multipart_upload(req, true);
    let file = files.file && files.file[0];
    console.log(file.path.replace(__dirname, `${HOST_NAME}`), "path ===> ");
    res.send({
      code: 0,
      codeText: "upload success",
      originalFilename: file.originalFilename,
      servicePath: file.path.replace(basePath, `${HOST_NAME}`),
    });
  } catch (err) {
    res.send({
      code: 1,
      codeTxt: err,
    });
  }
});

// base64文件上传
app.post("/upload_single_base64", async (req, res) => {
  //   console.log(req, "req ====> ");
  let { file, filename } = req.body;
  console.log(file, filename);
  // spark库 可以根据文件内容生成文件名
  let spark = new SparkMd5.ArrayBuffer();
  // ['.png', 'png', index: 0, input: '.png', groups: undefined]
  let suffix = /\.([0-9a-zA-Z]+)$/.exec(filename)[1],
    isExist = false,
    path;
  // 文件解码
  file = decodeURIComponent(file);
  file = file.replace(/^data:image\/\w+;base64,/, "");
  // 将一串字符串 转化为buffer
  file = Buffer.from(file, "base64");
  spark.append(file);
  // spark.end获取到生成的结果（根据文件内容生成）
  path = `${uploadDir}/${spark.end()}.${suffix}`;
  console.log("path ====> ", path);
  await delay();
  isExist = await isExistHandle(path);
  console.log(isExist, " isExist =====> ");
  if (isExist) {
    res.send({
      code: 1,
      codeText: "文件已经存在",
      originalFilename: filename,
      servicePath: path.replace(basePath, HOST_NAME),
    });
    return;
  }
  writeFile(res, path, file, filename, false);
});
// 缩略图文件上传
app.post("/upload_single_name", async (req, res) => {
  try {
    console.log("触发接口");
    let { fields, files } = await multipart_upload(req);
    let file = files.file && files.file[0],
      filename = (fields.filename && fields.filename[0]) || "";
    let pathFile = `${uploadDir}/filename`;
    let isExist = isExistHandle(pathFile);
    if (isExist) {
      res.send({
        code: 0,
        codeText: "file is isExist",
        originalFilename: file.originalFilename,
        servicePath: file.path.replace(basePath, `${HOST_NAME}`),
      });
      return;
    }
    writeFile(res, pathFile, file, filename, false);
  } catch (err) {
    res.send({
      code: 1,
      codeTxt: err,
    });
  }
});
