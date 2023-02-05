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
