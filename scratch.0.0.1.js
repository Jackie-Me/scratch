'use strict';
(function (global) {
    var Scratch = function (options) {
            this.options = options || {};
            this.events = {};
            this.container = options.container || document.getElementById('scratch-container');
            // 初始化默认值
            this.init(this.options);
        },
        fn = Scratch.prototype;
    var $ = function (name) {
        return document.querySelector(name)
    };
    fn.constructor = Scratch;
    fn.init = function (options) {
        var canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        if (!canvas.getContext) {
            return this;
        }
        this.onScratchReady = options.onScratchReady || function () {
        };
        this.onScratchDiscovered = options.onScratchDiscovered || function () {
        };
        //图片的宽度
        this.width = options.width || 100;
        //图片的高度
        this.height = options.height || 50;
        this.DEBUG = options.debugMode || false;
        //遮罩层
        this.prizeMask = options.prizeMask || '';
        //刮开后的宽高
        var commonStyles = "width:" + this.width + "px;height:" + this.height + "px;";
        this.drawState = false;
        this.debug = true;
        this.canvas = canvas;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        //刮开后的图片
        this.image = document.createElement('div');
        this.image.setAttribute("class", "prize");
        this.image.setAttribute("style", commonStyles);


        this.container.setAttribute("class", "scratch-card");
        this.container.setAttribute("style", commonStyles);
        this.container.appendChild(this.image);
        this.container.appendChild(this.canvas);
        //监听区域是否超过此处
        this.keyPointList = [
            {x: 100, y: 50},
            {x: 180, y: 50},
            {x: 100, y: 90},
            {x: 180, y: 90},
            {x: 140, y: 70}
        ];
        this.initScratchImage();
        return this;
    };
    //初始化刮层img
    fn.initScratchImage = function () {
        var _this = this;
        this.scratchImage = new Image();
        this.scratchImage.onload = function () {
            _this.resetScratch();
        };

        this.scratchImage.src = this.prizeMask;
        return true;
    };
    //当点击开始的时候
    fn.scratchReady = function (prizeImg) {
        this.DEBUG && window.console && console.log('scratch ready');
        this.drawState = false;
        this.image.style.backgroundImage = "url('" + prizeImg + "')";
        //需要加载到图片后执行
        this.scratchImage.src = this.prizeMask;
        this.initEvents();
    };
    //当刮动的时候
    fn.scratchStart = function (onScratchReady) {
        this.DEBUG && window.console && console.log('scratch start');
        this.drawState = true;
        if (this.debug) {
            this.debug = false;
            this.resetInterval();

        }
        onScratchReady && onScratchReady.call(this, arguments)
    };
    //结束的时候
    fn.scratchEnd = function (endCallback) {
        this.DEBUG && window.console && console.log('scratch end');
        this.drawState = false;
        endCallback && endCallback.call(this, arguments)
    };
    //重置
    fn.refreshScratch = function () {
        this.canvas.remove();
        this.image.remove();
        this.init(this.options);
        this.scratchStart(this.onScratchReady)
    };
    //执行刮开
    fn.initEvents = function () {
        var _this = this;
        var ctx = this.canvas.getContext('2d');
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        this.lastPoint = {
            x: null,
            y: null
        };
        this.touchState = false;
        this.canvas.addEventListener('touchstart', function (event) {
            event.preventDefault();
            event.stopPropagation();
            var x, y,
                offsetLeft = _this.canvas.getBoundingClientRect().left + document.body.scrollLeft, //获取当前点击的的left值
                offsetTop = _this.canvas.getBoundingClientRect().top + document.body.scrollTop,//活动当前点击的top
                offsetWidht = _this.canvas.getBoundingClientRect().width,
                offsetHeight = _this.canvas.getBoundingClientRect().height;
            if (_this.drawState && event.target == _this.canvas) {
                x = event.changedTouches[0].pageX - offsetLeft;
                y = event.changedTouches[0].pageY - offsetTop;
                var realX = _this.width / offsetWidht * x;
                var realY = _this.height / offsetHeight * y;
                _this.touchState = true;
                _this.lastPoint.x = realX;
                _this.lastPoint.y = realY;
                return false;
            }
            return true;
        }, false);
        this.canvas.addEventListener('touchmove', function (event) {
            event.preventDefault();
            event.stopPropagation();
            var x, y,
                offsetLeft = _this.canvas.getBoundingClientRect().left + document.body.scrollLeft,
                offsetTop = _this.canvas.getBoundingClientRect().top + document.body.scrollTop,
                offsetWidht = _this.canvas.getBoundingClientRect().width,
                offsetHeight = _this.canvas.getBoundingClientRect().height;

            if (_this.drawState && _this.touchState && event.target == _this.canvas) {
                x = event.changedTouches[0].pageX - offsetLeft;
                y = event.changedTouches[0].pageY - offsetTop;

                var realX = _this.width / offsetWidht * x;
                var realY = _this.height / offsetHeight * y;

                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                ctx.moveTo(_this.lastPoint.x, _this.lastPoint.y);
                ctx.lineTo(realX, realY);
                ctx.stroke();
                _this.canvas.style.opacity = 0.99;
                setTimeout(function () {
                    _this.canvas.style.opacity = 1;
                }, 1);

                _this.lastPoint.x = realX;
                _this.lastPoint.y = realY;
                return false;
            }
            return true;
        });
        this.canvas.addEventListener('touchend', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (_this.drawState && _this.touchState) {
                _this.touchState = false;
                return false;
            }
            return true;
        });
        return true;
    };
    //刮掉点
    fn.getPixelAlpha = function (x, y) {
        var ctx = this.canvas.getContext('2d');
        var ImageData = ctx.getImageData(x, y, 1, 1);
        return ImageData.data[3];
    };
    fn.checkScratch = function () {
        var keys = this.keyPointList,
            count = 0;
        if (keys) {
            for (var i = 0; i < keys.length; i++) {
                if (this.getPixelAlpha(keys[i].x, keys[i].y) !== 255) {
                    count += 1;
                }
            }
        }
        return keys && count >= 4;
    };
    //执行是否刮掉 刮到一定区域 隐藏层
    fn.resetInterval = function () {
        var _this = this;
        _this.canvas.addEventListener('touchend', function () {
            if (_this.checkScratch()) {
                _this.scratchEnd(_this.onScratchDiscovered);
                _this.canvas.style.display = 'none';
            }
            _this.debug = true;
        }, false);
        return this;
    };
    fn.resetScratch = function () {
        var _this = this,
            ctx = this.canvas.getContext('2d');
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(this.scratchImage, 0, 0, this.width, this.height);
        _this.canvas.style.opacity = 0.99;
        setTimeout(function () {
            _this.canvas.style.opacity = 1;
        }, 1);
        return this;
    };
    //兼容图片可以随屏幕大小设置
    var scratchBoxWidth, scratchBoxHeight;
    window.onresize = function () {
        scratchBoxWidth = $('.scratchBox').offsetWidth;
        scratchBoxHeight = $('.scratchBox').offsetHeight;
        $('#canvas').style.width = scratchBoxWidth + 'px';
        $('#canvas').style.height = scratchBoxHeight + 'px';
        $('.prize').style.width = scratchBoxWidth + 'px';
        $('.prize').style.height = scratchBoxHeight + 'px';
    };
    global.Scratch = global.Scratch || Scratch;

})(this);