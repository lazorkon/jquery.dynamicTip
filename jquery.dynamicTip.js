/**
 * @version 1.0.3
 * @author Nazar Lazorko
 * @requires jQuery
 * @see jQuery.fn.dynamicTip#defaultOptions
 */
;(function ($) {
    /**
     * @param {Object} options
     * @return jQuery
     */
    $.fn.dynamicTip = function (options) {
        /** @private */
        this.dynamicTip = (function (plugin, options) {
            var facade = {
                show: function () {

                },
                hide: function () {
                    dynamicTip.hideTip();
                }
            };
            var dynamicTip = new DynamicTip(facade, plugin, options);
            return facade;
        })(this, options);
        return this;
    };


    var eventNS = 'dynamicTip';
    var defaultOptions = {
        /**
         * @type {Function} Callback for tip content loading
         *
         * @param {Object} tip Tip public methods
         * @param {HTMLElement} node Active node
         * @param {Function} callback Callback for tip content updating (function (html) {})
         * @return {String|*} Returned string will be immediately shown on tip, otherwise tip will be canceled
         */
        source: undefined,

        showDelay: 100,
        hideDelay: 100,
        offsetX: 15,
        offsetY: 15,
        tipClass: 'dynamic_tip',
        tipCss: {
            backgroundColor: '#fffef0',
            border: '2px solid #dfdfdf',
            padding: '5px 10px',
            position: 'absolute',
            fontSize:'12px',
            zIndex: 2048
        }
    };
    var DynamicTip = function (facade, plugin, options) {
        this.init.apply(this, arguments);
    };
    DynamicTip.prototype = {
        /**
         *
         * @param {Object} facade
         * @param {jQuery} plugin
         * @param {Object} options
         * @return {DynamicTip}
         */
        init: function (facade, plugin, options) {
            this.facade = facade;
            this.options = $.extend(true, {}, defaultOptions, options);

            this.tip = {
                /** @type {HTMLElement} Active node */
                node: undefined,
                /** @type {jQuery} Tip container */
                container: this.createTipContainer(),
                needHide: false
            };

            var that = this;
            plugin.each(function () {
                var target = $(this);
                target.bind('mouseleave.' + eventNS, function () { that.onNodeMouseLeave.apply(that, arguments); });
                target.bind('mouseenter.' + eventNS, function () { that.onNodeMouseEnter.apply(that, arguments); });
            });
            return this;
        },

        createTipContainer: function () {
            var that = this;

            return $(document.createElement('div'))
                .addClass(this.options.tipClass)
                .css(this.options.tipCss)
                .bind('mouseenter.' + eventNS, function () { that.onTipMouseEnter.apply(that, arguments); })
                .bind('mouseleave.' + eventNS, function () { that.onTipMouseLeave.apply(that, arguments); })
                .appendTo(document.body)
                .hide();
        },

        onTipMouseEnter: function (e) {
            this.tip.needHide = false;
            return this;
        },

        onTipMouseLeave: function (e) {
            var that = this;
            this.tip.needHide = true;
            setTimeout(function () {
                that.tipHideCheck();
            }, this.options.hideDelay);
            return this;
        },

        tipHideCheck: function () {
            if (this.tip.needHide) {
                this.tip.needHide = false;
                this.tip.node = undefined;
                this.hideTip();
            }
            return this;
        },

        getViewPort: function() {
            var $window = $(window);
            return {
                left: $window.scrollLeft(),
                top: $window.scrollTop(),
                width: $window.width(),
                height: $window.height()
            };
        },

        /**
         *
         * @param {String|HTMLElement|jQuery|undefined} content
         * @return {*}
         */
        showTip: function (content) {
            if (null == this.tip.node) {
                return this;
            }

            var container = this.tip.container.empty();

            if (null == content || false === content) {
                container.hide();
                return this;
            }

            var offset = $(this.tip.node).offset(),
                view = this.getViewPort(),
                css = $.extend({}, offset);

            if (content && (content instanceof jQuery || content.nodeType == 1)) {
                container.append(content);
            } else {
                container.html(content);
            }

            css.top += this.options.offsetY;
            css.left += this.options.offsetX;
            var width = container.width(), height = container.height();
            if (view.left + view.width < css.left + width) {
                css.left = offset.left - this.options.offsetX - width;
                css.left = (css.left > css.left) ? css.left : 0;
            }
            if (view.top + view.height < css.top + height) {
                css.top = offset.top - this.options.offsetY - height;
                css.top = (css.top > 0) ? css.top : 0;
            }

            container.css(css).show();
            return this;
        },

        hideTip: function () {
            if (this.tip.container.is(':visible')) {
                this.tip.container.hide().empty();
            }
            return this;
        },

        onNodeMouseEnter: function (e) {
            var that = this,
                node = e.currentTarget;
            this.tip.node = node;
            this.tip.needHide = false;
            setTimeout(function () {
                that.checkMouseEnterNode(node);
            }, this.options.showDelay);
            return true;
        },

        onNodeMouseLeave: function (e) {
            var that = this;
            this.tip.node = e.currentTarget;
            this.tip.needHide = true;
            setTimeout(function () {
                that.tipHideCheck();
            }, this.options.hideDelay);
            return true;
        },

        checkMouseEnterNode: function (node) {
            var that = this, content;
            if (this.tip.node === node) {
                this.hideTip();
                if ($.isFunction(this.options.source)) {
                    content = this.options.source.call(null, this.facade, node, function (content) {
                        if (that.tip.node === node) {
                            that.showTip(content);
                        }
                    });
                } else {
                    content = this.options.source;
                }

                if (null != content && false !== content) {
                    this.showTip(content);
                }
            }
            return this;
        }
    };

})(jQuery);