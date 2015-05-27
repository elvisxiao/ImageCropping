var ImageCropping = function(options){
	this.config = {
		container: 'body'
	};
	this.ele = null;     //jquery对象，最外层
	this.canvas = null;  //canvas元素
	this.ctx = null;   //canvas.getContext();
	this.img = null;   //当前的图片
	this.filter = null;    //Jquery对象，裁剪框
	this.scaleHeight = 0;  //未放大或者缩小的初始高度
	this.scaleWidth = 0;  //未放大或者缩小的初始宽度

	for(var key in options){
		if(this.config.hasOwnProperty(key)){
			this.config[key] = options[key];
		}
	}
    
	var self = this;

	self.render = function(){
		self.ele = $('<div class="zImgUploader"></div>');
		var wrap = $('<div class="zImgUploaderWrap"></div>').appendTo(self.ele);
		wrap.append('<canvas class="zImgUploaderCanvas"></canvas>');
        wrap.append('<span class="zImgUploaderCover zImgUploaderCoverTop"></span>');
        wrap.append('<span class="zImgUploaderCover zImgUploaderCoverRight"></span>');
        wrap.append('<span class="zImgUploaderCover zImgUploaderCoverLeft"></span>');
        wrap.append('<span class="zImgUploaderCover zImgUploaderCoverBottom"></span>');
		wrap.append('<span class="zImgUploaderFilter"><i class="zCutDown"></i><i class="zCutLeft"></i><i class="zCutRight"></i><i class="zCutUp"></i></span>');
		self.ele.append('<div class="zImgUploaderControl"><span class="iptFile"><input type="file" accept="image/*">Open</span><span class="zCutRange"><b>－</b><input type="range" min="50" max="500" step="1"><b>＋</b><span class="zRangePercent">0%</span></span><span class="zCutImageSize">0 × 0</span><button class="btnCut">Cut</button></div>');

		self.canvas = self.ele.find('canvas')[0];
		self.ctx = self.canvas.getContext('2d');
		self.img = new Image();
		self.filter = self.ele.find('.zImgUploaderFilter');

		self.ele.appendTo(self.config.container);

		self.bindEvents();
	}

	self.bindEvents = function(){
		self.downWidth = self.filter.width();
        self.downHeight = self.filter.height();
        self.downLeft = self.filter.position().left;
        self.downTop = self.filter.position().top;
        self.downPosition = {};
        
        var reader = new FileReader();
        
		self.ele.on('change', 'input[type="file"]', function(){
			var file = this.files[0];
            if(!/image\/.*/.test(file.type)){
                oc.dialog.tips('Only image file is accept');
                return;
            }

            self.ele.find('.zImgUploaderFilter').css('display', 'block');
            
            reader.onload = function(e){
                self.img.src = this.result;
                self.drawImage();
                self.scaleWidth = self.img.width;
                self.scaleHeight = self.img.height;

                self.ele.find('.zCutImageSize').html(self.img.width + ' × ' + self.img.height);
                self.ele.find('.zCutRange input').val(100);
                self.ele.find('.zRangePercent').html('100%');
            }

            reader.readAsDataURL(file);
		})
        .on('input', '.zImgUploaderControl input[type="range"]', function(){
            self.ele.find('.zImgUploaderControl .zRangePercent').html(this.value + '%');
            self.range();
        })
        .on('click', '.zImgUploaderControl b', function(){
            var range = parseInt(self.ele.find('.zImgUploaderControl .zRangePercent').html());
            if(this.innerHTML === '－'){
                range -= 10;
                (range < 50) && (range = 50);
            }
            else{
                range += 10;
                (range > 500) && (range = 500);
            }
            self.ele.find('.zImgUploaderControl .zRangePercent').html(range + '%');
            self.ele.find('.zImgUploaderControl input[type="range"]').val(range);
            self.range();
        })
        .on('click', '.btnCut', self.cutImage)
		.on('mousedown', '.zImgUploaderFilter', function(e){
			if(e.which === 1){
                self.downPosition = e.originalEvent;
                downLeft = self.filter.position().left;
                downTop = self.filter.position().top;
       
                $(document).off('mousemove');
                $(document).on('mousemove', function(e){
                	self.moveFilter(e);
                });
            }
            else{
            	console.log('off move');
                $(document).off('mousemove');
            }
		})
		.on('mousedown', '.zImgUploaderFilter i', function(e){
			e.stopPropagation();
            self.downWidth = self.filter.width();
            self.downHeight = self.filter.height();
            self.downLeft = self.filter.position().left;
            self.downTop = self.filter.position().top;

            var ele = $(this);
            if(e.which === 1){
                self.downPosition = e.originalEvent;
                $(document).off('mousemove');
                $(document).on('mousemove', function(e){
                    self.moveFilterIcon(e, ele);
                });
            }
            else{
            	console.log('off move');
                $(document).off('mousemove');
            }
		})

		$(document).on('mouseup', function(){
            $(document).off('mousemove');
        })
	}

	self.drawImage = function(){
        if(!self.img.src){
            return;
        }
        self.canvas.width = self.img.width;
        self.canvas.height = self.img.height;
        $(self.canvas).parent().css({
            'margin-left': self.canvas.width / -2.0,
            'margin-top': self.canvas.height / -2.0,
        });
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

        self.ctx.drawImage(self.img, 0, 0, self.img.width, self.img.height);

        self.resetCover();
    }

    self.range = function(){
        var rangeVal = self.ele.find('.zImgUploaderControl input[type="range"]').val();
        self.canvas.width = self.scaleWidth * rangeVal / 100.0;
        self.canvas.height = self.scaleHeight * rangeVal / 100.0;

        $(self.canvas).parent().css({
            'margin-left': self.canvas.width / -2.0,
            'margin-top': self.canvas.height / -2.0,
        });
        self.ctx.drawImage(self.img, 0, 0, self.canvas.width, self.canvas.height);
        self.resetFilter();
        self.resetCover();
    }

    self.cutImage = function(){
        if(!self.img.src){
            return;
        }

        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        var currRange = self.ele.find('.zImgUploaderControl input[type="range"]').val() / 100;
        var width = self.filter.width();
        var height = self.filter.height();
        self.canvas.width = width;
        self.canvas.height = height;

        $(self.canvas).parent().css({
            'margin-left': self.canvas.width / -2.0,
            'margin-top': self.canvas.height / -2.0,
        });

        self.ctx.drawImage(self.img, self.filter.position().left / currRange, self.filter.position().top / currRange, 
           width / currRange, height / currRange, 0, 0, width, height);

        self.resetFilter();
        self.resetCover();
        
        self.ele.find('.zImgUploaderCover').css({
            width: 0,
            height: 0
        })
        self.ele.find('.zImgUploaderControl input[type="range"]').val(100);
        self.ele.find('.zImgUploaderControl .zRangePercent').html('100%');
        self.ele.find('.zImgUploaderControl .zCutImageSize').html(width + ' × ' + height);
        self.scaleWidth = width / currRange;
        self.scaleHeight = height / currRange;
        self.img.src = self.canvas.toDataURL("image/png"); 
    }

    self.moveFilter = function(e){
    	var currentPosition = e.originalEvent;
   		
        var left = downLeft + currentPosition.clientX - self.downPosition.clientX;
        var top = downTop + currentPosition.clientY - self.downPosition.clientY;
        if(left < 0){
            left = 0;
        }
        if(top < 0){
            top = 0;
        }
        self.resetFilter();

        self.resetCover();
    }

    self.resetFilter = function(){
        var parent = $(self.canvas).parent();
        var left = parseInt(parent.css('margin-left')) + self.ele.width() / 2;
        var right = self.ele.width() - self.canvas.width - left;
        var top = parseInt(parent.css('margin-top')) + self.ele.height() / 2;
        var bottom = self.ele.height() - self.canvas.height - top;

        left < 0? (left *= -1) : (left = 0);
        right < 0? (right *= -1) : (right = 0);
        bottom < 0? (bottom *= -1) : (bottom = 0);
        top < 0? (top *= -1) : (top = 0);

        self.filter.css({
            width: 'auto',
            height: 'auto',
            left: left,
            right: right,
            top: top,
            bottom: bottom
        })
    }

    self.resetCover = function(){
        var position = self.filter.position();

        self.ele.find('.zImgUploaderCoverTop').css({
            height: position.top,
            width: '100%',
            left: 0,
            top: 0
        });
        self.ele.find('.zImgUploaderCoverBottom').css({
            height: self.canvas.height - position.top - self.filter.height() - 2,
            width: '100%',
            bottom: '2px',
            left: 0
        });
        self.ele.find('.zImgUploaderCoverRight').css({
            width: self.canvas.width - self.filter.width() - position.left,
            height: self.filter.height() + 2,
            top: position.top,
            right: 0
        });
        self.ele.find('.zImgUploaderCoverLeft').css({
            width: position.left,
            height: self.filter.height() + 2,
            top: position.top,
            left: 0
        });
    }

    self.moveFilterIcon = function(e, i){
    	
    	e.stopPropagation();

        var currentPosition = e.originalEvent;
        var ele = $(i);
        var parent = ele.parent();
        // console.log(currentPosition.clientX - self.downPosition.clientX);
        var addWidth = currentPosition.clientX - self.downPosition.clientX;
        var addHeight = currentPosition.clientY - self.downPosition.clientY;

        var width = self.downWidth + addWidth;
        var height = self.downHeight + addHeight;

        var canvasParent = $(self.canvas).parent();
        var left = parseInt(canvasParent.css('margin-left')) + self.ele.width() / 2;
        var right = self.ele.width() - self.canvas.width - left;
        var top = parseInt(canvasParent.css('margin-top')) + self.ele.height() / 2;
        var bottom = self.ele.height() - self.canvas.height - top;

        if(i.hasClass('zCutRight')){
            var max = self.canvas.width + right - self.downLeft;
            if(right < 0 && max < width){
                width = max;
            }
            else if(right > 0){
                max = self.canvas.width - self.downLeft;
                if(max < width){
                    width = max;
                }
            }
            
            parent.css({
                width: width
            })
        }
        else if(i.hasClass('zCutDown')){
            var max = self.canvas.height + bottom - self.downTop;
            if(bottom < 0 && max < height){
                height = max;
            }
            else if(bottom > 0){
                max = self.canvas.height - self.downTop;
                if(max < height){
                    height = max;
                }
            }
            
            parent.css({
                height: height
            })
        }
        else if(i.hasClass('zCutLeft')){
            if(left < 0 && self.downLeft + left <= -1 * addWidth){
                addWidth = (self.downLeft + left) * -1;
            }
            else if(left > 0 && self.downLeft <= -1 * addWidth){
                addWidth = -1 * self.downLeft;
            }
            parent.css({
                left: self.downLeft + addWidth,
                width: self.downWidth - addWidth + 2
            })
        }
        else if(i.hasClass('zCutUp')){
            if(top < 0 && self.downTop + top <= -1 * addHeight){
                addHeight = (self.downTop + top) * -1;
            }
            else if(top > 0 && self.downTop <= -1 * addHeight){
                addHeight = -1 * self.downTop;
            }
            parent.css({
                top: self.downTop + addHeight,
                height: self.downHeight - addHeight + 2
            })
        }
        

        self.resetCover();
    }

    self.render();
}

window.module && window.module.exports && (module.exports = ImageCropping);