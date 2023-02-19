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
function merge(HASH, count) {
  return new Promise(async (resolve, reject) => {
    let path = `${uploadDir}/${HASH}`;
    console.log(path, "path ===>");
    let fileList = [],
      suffix;
    let isExist = await isExistHandle(path);
    console.log(isExist, "merge ====> ");
    if (!isExist) {
      reject();
      return;
    }
    fileList = fs.readdirSync(path);
    console.log(fileList, "fileList ===> ");
    if (fileList.length < count) {
      reject("the slice has not been uploaded");
      return;
    }
    fileList
      .sort((a, b) => {
        let reg = /_(\d+)/;
        return reg.exec(a)[1] - reg.exec(b)[1];
      })
      .forEach((item) => {
        !suffix ? (suffix = /\.([0-9a-zA-Z]+$)/.exec(item)[1]) : null;
        fs.appendFileSync(
          `${uploadDir}/${HASH}.${suffix}`,
          fs.readFileSync(`${path}/${item}`)
        );
        fs.unlinkSync(`${path}/${item}`);
      });
    console.log("merge 完成===>  ");
    // 删除临时文件夹
    // fs.rmdirSync(path);
    resolve({
      path: `${uploadDir}/${HASH}.${suffix}`,
      filename: `${HASH}.${suffix}`,
    });
  });
}
const writeFile = (res, path, file, filename, stream) => {
  console.log(path, "path ====> ");
  console.log(file, "file ====> ");
  console.log(filename, "filename ====> ");
  return new Promise((resolve, reject) => {
    if (stream) {
      const readStream = fs.createReadStream(file.path);
      const writeStream = fs.createWriteStream(path);
      // readStream.pipe(writeStream);
      readStream.on("data", (chunk) => {
        writeStream.write(chunk);
      });
      readStream.on("end", () => {
        resolve(true);
        res.send({
          code: 0,
          codeText: "file upload successfully",
        });
      });
      readStream.on("error", (err) => {
        reject(err);
        res.send({
          code: 1,
          codeText: "file upload failed",
        });
      });
      return;
    }
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
const uploadDir = `${__dirname}/upload`;
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
      console.log(fields, "fields ====> ", files, "files ====> ");
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
    let pathFile = `${uploadDir}/${filename}`;
    let isExist = await isExistHandle(pathFile);
    console.log(isExist, "isExist =====> ");
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

// 上传切片
app.post("/upload_chunk", async (req, res) => {
  try {
    const { fields, files } = await multipart_upload(req);
    let file = (files.file && files.file[0]) || {};
    const filename = fields && fields.filename;
    const [, HASH] = /^([^_]+)_(\d+)/.exec(filename);
    console.log(HASH);
    let path = `${uploadDir}/${HASH}`;
    // 没有该目录则创建临时目录
    !fs.existsSync(path) ? fs.mkdirSync(path) : null;
    // 将切片存入该临时文件夹
    path = `${uploadDir}/${HASH}/${filename}`;
    const isExist = await isExistHandle(path);
    console.log(isExist, "isExist ===> ");
    if (isExist) {
      return res.send({
        code: 0,
        codeText: "file is already esixts",
      });
    }
    writeFile(res, path, file, filename, true);
  } catch (err) {}
});

// 合并切片
app.post("/upload_merge", async (req, res) => {
  const { HASH, count } = req.body;
  console.log(HASH, "HASH ====> ", count, "count ===> ");
  try {
    const { filename, path } = await merge(HASH, count);

    res.send({
      code: 0,
      codeText: "merge successfully",
    });
  } catch (err) {
    res.send({
      code: 1,
      codeText: "merge fail",
    });
  }
});

// 已经上传的文件
app.get("/upload_already", async (req, res) => {
  let { HASH } = req.query;
  let path = `${uploadDir}/${HASH}`;
  try {
    let fileList = fs.readdirSync(path);
    fileList.sort((a, b) => {
      let reg = /_(\d+)/;
      return reg.exec(a)[1] - reg.exec(b)[1];
    });
    res.send({
      code: 0,
      codeText: "already list",
      fileList,
    });
  } catch (err) {
    res.send({
      code: 0,
      codeText: err,
      fileList: [],
    });
  }
});
