function delay(time) {
  typeof time === "number" ? time : (time = 500);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
// 生成唯一数
function createRandomNum() {
  let random = Math.random() * new Date();
  return random.toString(16).replace(".", "");
}
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

// 文件上传进度管控
(function () {
  const upload_progress = document.querySelector(".upload-item-progress");
  const upload_btn_select = upload_progress.querySelector(
    ".upload__btn.select"
  );
  const upload_btn_upload = upload_progress.querySelector(
    ".upload__btn.upload"
  );
  const upload_ipt = upload_progress.querySelector(".upload__origin");
  const upload_bar_wrapper = upload_progress.querySelector(".upload__progress");
  const progress_bar = upload_progress.querySelector(
    ".upload__progress--value"
  );
  // 监听用户选择文件的操作
  upload_ipt.addEventListener("change", async function () {
    /**
     * + name: 文件名
     * + size: 文件大小
     * + type: 文件的MIME类型
     * **/
    const file = this.files[0];
    const limitSize = 200 * 1024 * 1024;
    if (!file) return;

    // 限制文件上传的大小
    if (file.size > limitSize) return alert("上传的文件不能超过200MB");
    const { filename } = file;
    // 把文件传给服务器： FormData / Base64
    let fm = new FormData();
    fm.append("file", file);
    fm.append("filename", filename);
    try {
      upload_bar_wrapper.style.display = "inline-block";
      const res = await instance.post("/upload_single", fm, {
        onUploadProgress(e) {
          console.log(e, "e ====>");
          const { progress } = e;
          let percent = (progress * 100).toFixed(2);
          progress_bar.style.width = `${percent}%`;
        },
      });
      if (res.code === 0) {
        progress_bar.style.width = `100%`;
        await delay(500);
        alert(`文件上传成功`);
      }
    } catch (err) {
      alert("文件上传失败，请重新上传");
    } finally {
      progress_bar.style.width = `0%`;
      upload_bar_wrapper.style.display = "none";
    }
  });

  // 中转 触发文件选择器的点击
  upload_btn_select.addEventListener("click", function () {
    console.log("触发文件选择");
    upload_ipt.click();
  });
})();

// 多文件上传
(function () {
  const upload_multipe = document.querySelector(".upload-item-multiple");
  const upload_btn_select = upload_multipe.querySelector(".upload__btn.select");
  const upload_btn_upload = upload_multipe.querySelector(".upload__btn.upload");
  const upload_ipt = upload_multipe.querySelector(".upload__origin");
  const multipe_list = upload_multipe.querySelector(".upload__list");
  let _files = [];
  // 监听用户上传到服务器
  upload_btn_upload.addEventListener("click", async function () {
    if (!_files.length) return alert("请选择文件");
    console.log(_files, "_files is ====> ");
    console.log(multipe_list, "multipe_list===> ");
    let uploadLiList = Array.from(multipe_list.querySelectorAll("li"));
    _files = _files.map((item) => {
      let curLi = uploadLiList.find(
          (childLi) => childLi.getAttribute("key") === item.key
        ),
        curSpan = curLi ? curLi.querySelector("span:nth-child(2)") : null;
      console.log(curSpan, "curSpan ==============> ");
      let fm = new FormData();
      fm.append("file", item.file);
      fm.append("filename", item.filename);
      return instance
        .post("/upload_single", fm, {
          onUploadProgress(e) {
            console.log(e.progress);
            // 检测上传进度
            if (curSpan) {
              let percent = (e.progress * 100).toFixed(2);
              curSpan.innerHTML = `${percent}%`;
            }
          },
        })
        .then((data) => {
          if (+data.code === 0) {
            return;
          }
          return Promise.reject();
        });
    });
    Promise.all(_files)
      .then(() => {
        alert("恭喜你，所有文件都上传成功");
      })
      .catch(() => {
        alert("很遗憾，上传过程中出现问题，请您稍后再试~~");
      })
      .finally(() => {
        _files = [];
        multipe_list.style.innerHTML = "";
        multipe_list.style.display = "none";
      });
  });
  // 利用事件委托来控制文件名的删除
  multipe_list.addEventListener("click", function (ev) {
    let target = ev.target,
      curLi = null;
    if (target.tagName === "EM") {
      curLi = target.parentNode.parentNode;
      if (!curLi) return;
      multipe_list.removeChild(curLi);
      key = curLi.getAttribute("key");
      _files = _files.filter((item) => item.key !== key);
      if (_files.length === 0) multipe_list.style.display = "none";
    }
  });
  // 监听用户选择文件的操作
  upload_ipt.addEventListener("change", async function () {
    // console.log("this ==> ", this);
    /**
     * + name: 文件名
     * + size: 文件大小
     * + type: 文件的MIME类型
     * **/
    let str = "";
    _files = Array.from(this.files);
    console.log(_files, "====> files ");
    _files = _files.map((item) => {
      return {
        file: item,
        filename: item.name,
        key: createRandomNum(),
      };
    });
    _files.forEach(
      (item) =>
        (str += `
      <li key=${item.key}>
        <span>文件:${item.filename}</span>
        <span class="remove"><em>移除</em></span>
      </li>
    `)
    );
    multipe_list.style.display = "inline-block";
    multipe_list.innerHTML = str;
    console.log(_files, "_files ===> ");
  });

  // 中转 触发文件选择器的点击
  upload_btn_select.addEventListener("click", function () {
    console.log("触发文件选择");
    upload_ipt.click();
  });
})();

// 拖拽上传
(function () {
  const drag_wrapper = document.querySelector(".upload-item-drag");
  const upload_btn_select = drag_wrapper.querySelector(".upload__btn.select");
  const upload_ipt = drag_wrapper.querySelector(".upload__origin");
  const drag_mask = drag_wrapper.querySelector(".upload__mask");
  async function uploadFile(file) {
    drag_mask.style.display = "inline-block";
    let fm = new FormData();
    fm.append("file", file);
    fm.append("filename", file.name);
    try {
      const data = await instance.post("/upload_single", fm);
      if (+data.code === 0) {
        alert("文件上传成功");
        return;
      }
      throw data.codeText;
    } catch (err) {
      alert("很遗憾，文件上传失败，请稍后重试");
    } finally {
      drag_mask.style.display = "none";
    }
  }
  // 拖拽获取 dragenter dragleave dragover drop

  // drag_wrapper.addEventListener("dragenter", function () {
  // console.log("拖拽进入");
  // 拖入时 do something 如容器样式的变化
  // });
  // drag_wrapper.addEventListener("dragleave", function () {
  // 拖拽离开容器时 do something 如容器样式的变化
  //   console.log("拖拽离开");
  // });
  drag_wrapper.addEventListener("dragover", function (e) {
    console.log("在区域内");
    e.preventDefault();
  });
  drag_wrapper.addEventListener("drop", function (e) {
    console.log("文件放置", e);
    // 阻止浏览器的默认行为=> 浏览器会默认将拖入的文件 视为预览行为
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    if (!file) return;
    uploadFile(file);
  });
  upload_ipt.addEventListener("change", function () {
    let file = this.files[0];
    if (!file) return;
    uploadFile(file);
  });

  upload_btn_select.addEventListener("click", () => {
    upload_ipt.click();
  });
})();

// 大文件切片上传
(function () {
  const upload_large_file = document.querySelector(".upload-item-large");
  const upload_btn_select = upload_large_file.querySelector(
    ".upload__btn.select"
  );
  const upload_btn_upload = upload_large_file.querySelector(
    ".upload__btn.upload"
  );
  const upload_ipt = upload_large_file.querySelector(".upload__origin");
  const upload_bar_wrapper =
    upload_large_file.querySelector(".upload__progress");
  const progress_bar = upload_large_file.querySelector(
    ".upload__progress--value"
  );

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

  // 监听用户选择文件的操作
  upload_ipt.addEventListener("change", async function () {
    /**
     * + name: 文件名
     * + size: 文件大小
     * + type: 文件的MIME类型
     * **/
    const file = this.files[0];
    if (!file) return;
    const { HASH, suffix } = await changeHash(file);
    let already = [];
    try {
      // 获取已经上传的切片信息
      let data = await instance.get("/upload_already", {
        params: {
          HASH,
        },
      });
      if (+data.code === 0) {
        already = data.fileList;
      }
    } catch (err) {}
    // 文件切片处理 固定数量/固定大小
    let max_size = 1024 * 1000,
      count = Math.ceil(file.size / max_size),
      index = 0,
      chunks = [];
    if (count > 100) {
      // 切片数量大于100 我们就将数量限制为100
      max_size = file.size / 100;
      count = 100;
    }
    // 完成操作
    async function complete() {
      // 进度条管控
      index++;
      upload_bar_wrapper.style.display = "inline-block";
      progress_bar.style.width = `${(index / count) * 100}%`;
      console.log(index, "index ====> ");
      if (index < count) return;
      // 全部上传完成
      progress_bar.style.width = `100%`;
      try {
        data = await instance.post(
          "/upload_merge",
          {
            HASH,
            count,
          },
          {
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
          }
        );
        if (+data.code === 0) {
          alert(
            `恭喜您，文件上传成功，您可以基于${data.servicePath} 访问该文件`
          );
          clear();
          return;
        }
        throw data.codeText;
      } catch (err) {
        alert("切片合并失败");
        clear();
      }
    }
    // clear
    function clear() {
      progress_bar.style.width = `0%`;
      upload_bar_wrapper.style.display = "none";
    }
    while (index < count) {
      chunks.push({
        file: file.slice(index * max_size, (index + 1) * max_size),
        filename: `${HASH}_${index + 1}.${suffix}`,
      });
      index++;
    }
    // 重置索引
    index = 0;
    // 把每一个切片都上传到服务器上
    chunks.forEach((chunk) => {
      // 已经上传的无需再上传
      if (already.length > 0 && already.includes(chunk.filename)) {
        complete();
        return;
      }
      let fm = new FormData();
      fm.append("file", chunk.file);
      fm.append("filename", chunk.filename);
      instance
        .post("/upload_chunk", fm)
        .then((data) => {
          if (+data.code === 0) {
            complete();
            return;
          }
          Promise.reject(data.codeText);
        })
        .catch((err) => {
          alert("当前切片上传失败，请您稍后再试~~~");
          clear();
        });
    });
  });

  // 中转 触发文件选择器的点击
  upload_btn_select.addEventListener("click", function () {
    console.log("触发文件选择");
    upload_ipt.click();
  });
})();
