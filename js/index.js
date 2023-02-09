// 基于Form-data
(function () {
  const upload_btn_select = document.querySelector(".upload__btn.select");
  const upload_btn_upload = document.querySelector(".upload__btn.upload");
  const upload_ipt = document.querySelector(".upload__origin");
  const upload_list = document.querySelector(".upload__list");
  const upload_tip = document.querySelector(".upload__tip");
  console.log(upload_ipt, "upload_ipt =====> ");
  let _file = null;

  // 上传文件到服务器
  upload_btn_upload.addEventListener("click", function (e) {
    if (!_file) return alert("请选择文件");

    console.log(_file, "_file is ====> ");
    // 把文件传给服务器： FormData / Base64
    let fm = new FormData();
    fm.append("file", _file);
    fm.append("filename", _file.name);
    instance
      .post("/upload_single", fm)
      .then((data) => {
        if (+data.code === 0) {
          alert("文件已经上传成功");
          clearHandle();
          return;
        }
        return Promise.reject(data.codeTxt);
      })
      .catch((reason) => {
        alert("文件上传失败，请你稍候再试~~");
        clearHandle();
      });
  });
  // 通过事件委托的方式 移除文件操作
  const clearHandle = () => {
    upload_list.style.display = "none";
    upload_tip.style.display = "block";
    // 清空list中的内容
    upload_list.innerHTML = "";
    // 清除文件
    _file = null;
  };
  upload_list.addEventListener("click", function (e) {
    if (e.target?.tagName === "EM") {
      clearHandle();
    }
  });

  // 监听用户选择文件的操作
  upload_ipt.addEventListener("change", function () {
    // console.log("this ==> ", this);
    const file = this.files[0];
    const limitSize = 2 * 1024 * 1024;
    if (!file) return;
    console.log(file, "file ===> ");
    // 限制文件上传的格式 js限制 通常使用file 原生的accept属性限制上传的类型
    // if (!/(PNG|JPG|JPEG)/i.test(file.type))
    //   return alert("上传的文件只能是PNG/JPG/JPEG格式的文件");

    // 限制文件上传的大小
    if (file.size > limitSize) return alert("上传的文件不能超过2MB");
    _file = file;
    // 显示上传的文件
    upload_list.style.display = "block";
    upload_tip.style.display = "none";
    upload_list.innerHTML = `
      <li>
        <span>文件${file.name}</span>
        <span class="remove"><em>移除</em></span>
      </li>
    `;
  });

  // 中转 触发文件选择器的点击
  upload_btn_select.addEventListener("click", function () {
    console.log("触发文件选择");
    upload_ipt.click();
  });
})();

// 基于base64
(function () {
  const upload_base64 = document.querySelector(".upload-item-base64");
  const upload_btn_select = upload_base64.querySelector(".upload__btn.select");
  const upload_btn_upload = upload_base64.querySelector(".upload__btn.upload");
  const upload_ipt = upload_base64.querySelector(".upload__origin");
  const upload_list = upload_base64.querySelector(".upload__list");
  const upload_tip = upload_base64.querySelector(".upload__tip");
  console.log(upload_ipt, "upload_ipt =====> ");
  let _file = null;

  upload_list.addEventListener("click", function (e) {
    if (e.target?.tagName === "EM") {
      clearHandle();
    }
  });
  // 把选择的文件读取成为base64
  function changeBase64(file) {
    return new Promise((resolve) => {
      let fileReader = new FileReader();
      // 将文件转变成base64编码格式
      fileReader.readAsDataURL(file);
      fileReader.addEventListener(
        "load",
        function () {
          // data:URL base64
          // let base64 = fileReader.result;
          // console.log(base64, "base64 ===> ");
          resolve(fileReader.result);
        },
        false
      );
    });
  }
  // 监听用户选择文件的操作
  upload_ipt.addEventListener("change", async function () {
    // console.log("this ==> ", this);
    /**
     * + name: 文件名
     * + size: 文件大小
     * + type: 文件的MIME类型
     * **/
    const file = this.files[0];
    const limitSize = 2 * 1024 * 1024;
    let base64Url, data;
    if (!file) return;

    // 限制文件上传的大小
    if (file.size > limitSize) return alert("上传的文件不能超过2MB");
    base64Url = await changeBase64(file);
    try {
      console.log(base64Url, "base64Url ==============>");
      data = await instance.post(
        "/upload_single_base64",
        {
          file: encodeURIComponent(base64Url), //防止传输过程中出现转码
          filename: file.name,
        },
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        }
      );
      if (+data.code === 0) {
        alert("恭喜你， 文件上传成功 ");
        return;
      }
      throw data.codeTxt;
    } catch (err) {
      alert("文件上传失败，请你稍后再试");
    }
  });

  // 中转 触发文件选择器的点击
  upload_btn_select.addEventListener("click", function () {
    console.log("触发文件选择");
    upload_ipt.click();
  });
})();

// 缩略图
(function () {
  const upload_thumbnail = document.querySelector(".upload-item-thumbnail");
  const upload_btn_select = upload_thumbnail.querySelector(
    ".upload__btn.select"
  );
  const upload_btn_upload = upload_thumbnail.querySelector(
    ".upload__btn.upload"
  );
  const upload_ipt = upload_thumbnail.querySelector(".upload__origin");
  const thumbnail_img = upload_thumbnail.querySelector(
    ".upload__thumbnail img"
  );
  let _file = null;
  // 把选择的文件读取成为base64
  function changeBase64(file) {
    return new Promise((resolve) => {
      let fileReader = new FileReader();
      // 将文件转变成base64编码格式
      fileReader.readAsDataURL(file);
      fileReader.addEventListener(
        "load",
        function () {
          // data:URL base64
          // let base64 = fileReader.result;
          // console.log(base64, "base64 ===> ");
          resolve(fileReader.result);
        },
        false
      );
    });
  }
  // 根据文件内容生成唯一的文件名
  function changeHash(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.addEventListener("load", () => {
        let buffer = fileReader.result,
          spark = new SparkMD5(),
          HASH,
          suffix;
        spark.append(buffer);
        HASH = spark.end();
        suffix = /\.([a-z0-9A-Z]+$)/.exec(file.name)[1];
        console.log(HASH, "HASH ==> ");
        resolve({
          buffer,
          HASH,
          suffix,
          filename: `${HASH}.${suffix}`,
        });
      });
    });
  }
  // 监听用户上传到服务器
  upload_btn_upload.addEventListener("click", async function () {
    if (!_file) return alert("请选择文件");
    console.log(_file, "_file is ====> ");
    let { filename } = await changeHash(_file);
    // 把文件传给服务器： FormData / Base64
    let fm = new FormData();
    fm.append("file", _file);
    fm.append("filename", filename);
    instance
      .post("/upload_single_name", fm)
      .then((data) => {
        if (+data.code === 0) {
          alert(
            `文件已经上传成功~~, 您可以基于 ${data.servicePath} 访问这个资源`
          );
          return;
        }
        return Promise.reject(data.codeTxt);
      })
      .catch((reason) => {
        alert("文(件上传失败，请你稍候再试~~");
      })
      .finally(() => {
        clearHandle();
        thumbnail_img.src = "";
        _file = null;
      });
  });
  // 监听用户选择文件的操作
  upload_ipt.addEventListener("change", async function () {
    // console.log("this ==> ", this);
    /**
     * + name: 文件名
     * + size: 文件大小
     * + type: 文件的MIME类型
     * **/
    const file = this.files[0];
    const limitSize = 2 * 1024 * 1024;
    let base64Url, data;
    if (!file) return;

    // 限制文件上传的大小
    if (file.size > limitSize) return alert("上传的文件不能超过2MB");
    _file = file;
    base64Url = await changeBase64(file);
    console.log(base64Url, "base64Url ==============>");
    // 文件预览
    thumbnail_img.style.display = "block";
    thumbnail_img.src = base64Url;
  });

  // 中转 触发文件选择器的点击
  upload_btn_select.addEventListener("click", function () {
    console.log("触发文件选择");
    upload_ipt.click();
  });
})();
