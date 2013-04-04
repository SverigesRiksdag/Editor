/**
 * jQuery plugin for getting position of cursor in textarea

 * @license under dfyw (do the f**k you want)
 * @author leChantaux (@leChantaux)
 */

;(function($, window, undefined) {
	// Create the defaults once
	var elementFactory = function(element, value) {
		element.text(value.val);
	};

	

	var pluginName = 'sew',
		document = window.document,
		defaults = {token: '@', elementFactory: elementFactory};

	function Plugin(element, options) {

		this.options = $.extend({}, defaults, options);
		this.ele = element;
		this.$element = $(element).siblings("iframe").contents().find("body");
		//console.log($(element).siblings("iframe").contents().find("body").html());
		this.$itemList = $(Plugin.MENU_TEMPLATE);
		this.reset();
		this._defaults = defaults;
		this._name = pluginName;
		this.expression = new RegExp('(?:^|\\b|\\s)' + this.options.token + '([\\w.]*)$');
		this.cleanupHandle = null;
		
		this.init(this);
	}

	Plugin.MENU_TEMPLATE = "<div class='-sew-list-container' style='display: none; position: absolute;'><ul class='-sew-list'></ul></div>";

	Plugin.ITEM_TEMPLATE = '<li class="-sew-list-item"></li>';

	Plugin.KEYS = [40, 38, 13, 27];

	Plugin.prototype.init = function(othis) {

		var currentEditor = this.options.editor;
		//console.log(this);

		currentEditor.on("load", function(e) {

            //console.log(othis);
           	$(currentEditor.composer.element).on("keyup", {"othis":othis}, function(e) {
                othis.onKeyUp(e, othis);
            });			
            $(currentEditor.composer.element).on("keydown", {"othis":othis}, function(e) {
                othis.onKeyDown(e, othis);
            });			
            $(currentEditor.composer.element).on("focus", function(e) {
                othis.renderElements(othis.options.values)
            });

        });
/*		$(document).bind('keyup', this.onKeyUp.bind(this))
					 .bind('keydown', this.onKeyDown.bind(this))
					 .bind('focus', this.renderElements.bind(this, this.options.values));
*/	
	};

	Plugin.prototype.reset = function() {
		this.index = 0;
		this.matched = false;
		this.dontFilter = false;
		this.lastFilter = undefined;
		this.filtered = this.options.values.slice(0);
	};

	Plugin.prototype.next = function() {
		this.index = (this.index + 1) % this.filtered.length;
		this.hightlightItem();
	};

	Plugin.prototype.prev = function() {
		this.index = (this.index + this.filtered.length - 1) % this.filtered.length;
		this.hightlightItem();
	};

	Plugin.prototype.select = function(othis) {
		this.replace(this.filtered[this.index].val, othis);		
		this.hideList();
	};


	Plugin.prototype.remove = function() {
		this.cleanupHandle = window.setTimeout(function(){
			this.$itemList.remove();
		}.bind(this), 1000);
	};

	Plugin.prototype.replace = function(replacement, othis) {
		console.log(othis);
		//$(othis.$element).html("zzz");
		var replacementString = "";
		
		var replacementStartPosition = othis.getSelectionStart(othis.$element[0], othis)-othis.options.lastsearch.length-1;
		//console.log(replacementStartPosition);
		if (replacementStartPosition === 0) {
			replacementString = " ";
		}
    	othis.options.editor.composer.commands.exec("insertHTML", " <span class='person'>" + replacement + "</span> ");
	    othis.$element.html(othis.$element.html().replace(othis.options.token + othis.options.lastsearch,replacementString));
	    
	};

	Plugin.prototype.hightlightItem = function() {
		this.$itemList.find(".-sew-list-item").removeClass("selected");
		this.filtered[this.index].element.addClass("selected");
	};

	Plugin.prototype.renderElements = function(values) {
		
		$("body").append(this.$itemList);

		var container = this.$itemList.find('ul').empty();
		values.forEach(function(e, i) {
			var $item = $(Plugin.ITEM_TEMPLATE)

			this.options.elementFactory($item, e);

			e.element = $item.appendTo(container)
				 			 .bind('click', this.onItemClick.bind(this, e))
				 			 .bind('mouseover', this.onItemHover.bind(this, i));
		}.bind(this));

		this.index = 0;
		this.hightlightItem();
	};

	Plugin.prototype.displayList = function(e) {
		if(!this.filtered.length) return;
		this.$itemList.show();
		var offset = $(e.currentTarget).offset();
		this.options.editor.composer.commands.exec("insertHTML", "<em id='positionerspan'></em>");
	    var pos = $("." + this.options.name).contents().find("#positionerspan").position();
	    var iframePos = $("." + this.options.name).position(); //TODO: Funkar inte med flera frames.
		this.$itemList.css({			
			left: offset.left + pos.left + iframePos.left,
			top: offset.top + pos.top + iframePos.top + 22
		});
		$("." + this.options.name).contents().find("#positionerspan").remove();
	};

	Plugin.prototype.hideList = function() {
		this.$itemList.hide();
		this.reset();
	};

	Plugin.prototype.filterList = function(val) {
		if(val == this.lastFilter) return;

		this.lastFilter = val;
		this.$itemList.find(".-sew-list-item").remove();

		var vals = this.filtered = this.options.values.filter(function(e) {
			return val == ""
				|| e.val.toLowerCase().indexOf(val.toLowerCase()) >= 0
				|| e.meta.toLowerCase().indexOf(val.toLowerCase()) >= 0;
		});
		if(vals.length) {
			this.renderElements(vals);
			this.$itemList.show();
		} else {
			this.hideList();
		}
	};

	Plugin.prototype.getSelectionStart = function(elementx, othis) {
		//
		var element = othis.$element[0];
		console.log(element)
	    var caretOffset = 0;
	    var iframe= $('.' + othis.options.name)[0];

	    var iframewindow= iframe.contentWindow? iframe.contentWindow : iframe.contentDocument.defaultView;
	    //console.log($(this.ele).siblings("iframe").contents().find("body").text());
	    //console.log(iframewindow.document.getSelection().getRangeAt(0));
	    if (typeof iframewindow.getSelection != "undefined") {	    	
	        var range = iframewindow.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.endContainer, range.endOffset);
	        caretOffset = preCaretRange.toString().length;
	    } else if (typeof document.selection != "undefined" && document.selection.type != "Control") {
	        var textRange = document.selection.createRange();
	        var preCaretTextRange = document.body.createTextRange();
	        preCaretTextRange.moveToElementText(element);
	        preCaretTextRange.setEndPoint("EndToEnd", textRange);
	        caretOffset = preCaretTextRange.text.length;
	    }
	    $("#curs").html(caretOffset) //TODO: Remove
	    //console.log("getSelectionStart: " + caretOffset);
	    return caretOffset;
	}

	Plugin.prototype.setCursorPosition = function(pos) {
		if (this.$element.get(0).setSelectionRange) {
			this.$element.get(0).setSelectionRange(pos, pos);
		} else if (this.$element.get(0).createTextRange) {
			var range = this.$element.get(0).createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	}

	Plugin.prototype.onKeyUp = function(e, othis) {
		
		//e.preventDefault();
		//console.log($(e.currentTarget)[0]);
		var text = $(e.currentTarget).text();
		//console.log($(e.currentTarget).text());
		var startpos = othis.getSelectionStart($(e.currentTarget)[0], othis);
		var val = text.substring(0, startpos);
		
		var matches = val.match(this.expression);
		
		if(!matches && this.matched) {
			this.matched = false;
			this.dontFilter = false;
			this.hideList();
			return;
		}

		if(matches && !this.matched) {
			this.displayList(e);
			this.lastFilter = "\n";
			this.matched = true;
		}

		if(matches && !this.dontFilter) {
			this.options["lastsearch"] = matches[1];
			this.filterList(matches[1]);
		}
	};

	Plugin.prototype.onKeyDown = function(e, othis) {

		var listVisible = this.$itemList.is(":visible");
		if(!listVisible || (Plugin.KEYS.indexOf(e.keyCode) < 0)) return;

		switch(e.keyCode) {
		case 13:
			this.select(othis);
			break;
		case 40:
			this.next();
			break;
		case 38:
			this.prev();
			break;
		case 27:
			this.hideList();
			this.dontFilter = true;
			break;
		}
		return false;
	};

	Plugin.prototype.onItemClick = function(element, e) {
		console.log(element);
		if(this.cleanupHandle) {
			window.clearTimeout(this.cleanupHandle);
		}
		//this.$element.blur();
		this.replace(element.val);
		//this.$element.focus();
		this.hideList();
	};

	Plugin.prototype.onItemHover = function(index, e) {
		this.index = index;
		this.hightlightItem();
		};

	$.fn[pluginName] = function(options) {
		return this.each(function() {
			if(!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			}
		});
	}
}(jQuery, window));

