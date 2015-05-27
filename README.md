# ImageCropping
前端图片预览，裁剪，使用FileReader、Canvas实现

纯前端实现的图片预览，图片裁剪功能，提供接口获取裁剪后的图片（Base64编码），浏览器环境需要支持HTML5的FileReader、Canvas, 支持拖拽，图片放大、缩小。 image crop、image cropper、picture cut、picture crop、image upload

###使用步骤
1、项目依赖于Jquery，请优先引入Jquery

2、在页面中引入ImageCropping.js和ImageCropping.css

3、初始化：

      var imgCroppint = new ImageCropping({
	        container: '#container'
	    });
具体请参考Demo.html


###开源策略
个人作品，可下载后随意更改，可用于任何途径

