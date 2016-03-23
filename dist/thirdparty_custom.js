if(! ('ace' in window) ) window['ace'] = {}

ace.config = {
 cookie_expiry : 604800, //1 week duration for saved settings
 storage_method: 2 //2 means use cookies, 1 means localStorage, 0 means localStorage if available otherwise cookies
}

ace.settings = {
	is : function(item, status) {
		//such as ace.settings.is('navbar', 'fixed')
		return (ace.data.get('settings', item+'-'+status) == 1)
	},
	exists : function(item, status) {
		return (ace.data.get('settings', item+'-'+status) !== null)
	},
	set : function(item, status) {
		ace.data.set('settings', item+'-'+status, 1)
	},
	unset : function(item, status) {
		ace.data.set('settings', item+'-'+status, -1)
	},
	remove : function(item, status) {
		ace.data.remove('settings', item+'-'+status)
	},

	navbar_fixed : function(fix) {
		fix = fix || false;
		if(!fix && ace.settings.is('sidebar', 'fixed')) {
			ace.settings.sidebar_fixed(false);
		}
		
		var navbar = document.getElementById('navbar');
		if(fix) {
			if(!ace.hasClass(navbar , 'navbar-fixed-top'))  ace.addClass(navbar , 'navbar-fixed-top');
			if(!ace.hasClass(document.body , 'navbar-fixed'))  ace.addClass(document.body , 'navbar-fixed');
			
			ace.settings.set('navbar', 'fixed');
		} else {
			ace.removeClass(navbar , 'navbar-fixed-top');
			ace.removeClass(document.body , 'navbar-fixed');
			
			ace.settings.unset('navbar', 'fixed');
		}
		
		document.getElementById('ace-settings-navbar').checked = fix;
	},


	breadcrumbs_fixed : function(fix) {
		fix = fix || false;
		if(fix && !ace.settings.is('sidebar', 'fixed')) {
			ace.settings.sidebar_fixed(true);
		}

		var breadcrumbs = document.getElementById('breadcrumbs');
		if(fix) {
			if(!ace.hasClass(breadcrumbs , 'breadcrumbs-fixed'))  ace.addClass(breadcrumbs , 'breadcrumbs-fixed');
			if(!ace.hasClass(document.body , 'breadcrumbs-fixed'))  ace.addClass(document.body , 'breadcrumbs-fixed');
			
			ace.settings.set('breadcrumbs', 'fixed');
		} else {
			ace.removeClass(breadcrumbs , 'breadcrumbs-fixed');
			ace.removeClass(document.body , 'breadcrumbs-fixed');
			
			ace.settings.unset('breadcrumbs', 'fixed');
		}
		document.getElementById('ace-settings-breadcrumbs').checked = fix;
	},


	sidebar_fixed : function(fix) {
		fix = fix || false;
		if(!fix && ace.settings.is('breadcrumbs', 'fixed')) {
			ace.settings.breadcrumbs_fixed(false);
		}

		if( fix && !ace.settings.is('navbar', 'fixed') ) {
			ace.settings.navbar_fixed(true);
		}

		var sidebar = document.getElementById('sidebar');
		if(fix) {
			if( !ace.hasClass(sidebar , 'sidebar-fixed') )  ace.addClass(sidebar , 'sidebar-fixed');
			ace.settings.set('sidebar', 'fixed');
		} else {
			ace.removeClass(sidebar , 'sidebar-fixed');
			ace.settings.unset('sidebar', 'fixed');
		}
		document.getElementById('ace-settings-sidebar').checked = fix;
	},


	sidebar_collapsed : function(collpase) {
		collpase = collpase || false;

		var sidebar = document.getElementById('sidebar');
		var icon = document.getElementById('sidebar-collapse').querySelector('[class*="icon-"]');
		var $icon1 = icon.getAttribute('data-icon1');//the icon for expanded state
		var $icon2 = icon.getAttribute('data-icon2');//the icon for collapsed state

		if(collpase) {
			ace.addClass(sidebar , 'menu-min');
			ace.removeClass(icon , $icon1);
			ace.addClass(icon , $icon2);

			ace.settings.set('sidebar', 'collapsed');
		} else {
			ace.removeClass(sidebar , 'menu-min');
			ace.removeClass(icon , $icon2);
			ace.addClass(icon , $icon1);

			ace.settings.unset('sidebar', 'collapsed');
		}

	},
	/**
	select_skin : function(skin) {
	}
	*/
}


//check the status of something
ace.settings.check = function(item, val) {
	if(! ace.settings.exists(item, val) ) return;//no such setting specified
	var status = ace.settings.is(item, val);//is breadcrumbs-fixed? or is sidebar-collapsed? etc
	
	var mustHaveClass = {
		'navbar-fixed' : 'navbar-fixed-top',
		'sidebar-fixed' : 'sidebar-fixed',
		'breadcrumbs-fixed' : 'breadcrumbs-fixed',
		'sidebar-collapsed' : 'menu-min'
	}


	//if an element doesn't have a specified class, but saved settings say it should, then add it
	//for example, sidebar isn't .fixed, but user fixed it on a previous page
	//or if an element has a specified class, but saved settings say it shouldn't, then remove it
	//for example, sidebar by default is minimized (.menu-min hard coded), but user expanded it and now shouldn't have 'menu-min' class
	
	var target = document.getElementById(item);//#navbar, #sidebar, #breadcrumbs
	if(status != ace.hasClass(target , mustHaveClass[item+'-'+val])) {
		ace.settings[item+'_'+val](status);//call the relevant function to mage the changes
	}
}






//save/retrieve data using localStorage or cookie
//method == 1, use localStorage
//method == 2, use cookies
//method not specified, use localStorage if available, otherwise cookies
ace.data_storage = function(method, undefined) {
	var prefix = 'ace.';

	var storage = null;
	var type = 0;
	
	if((method == 1 || method === undefined) && 'localStorage' in window && window['localStorage'] !== null) {
		storage = ace.storage;
		type = 1;
	}
	else if(storage == null && (method == 2 || method === undefined) && 'cookie' in document && document['cookie'] !== null) {
		storage = ace.cookie;
		type = 2;
	}

	//var data = {}
	this.set = function(namespace, key, value, undefined) {
		if(!storage) return;
		
		if(value === undefined) {//no namespace here?
			value = key;
			key = namespace;

			if(value == null) storage.remove(prefix+key)
			else {
				if(type == 1)
					storage.set(prefix+key, value)
				else if(type == 2)
					storage.set(prefix+key, value, ace.config.cookie_expiry)
			}
		}
		else {
			if(type == 1) {//localStorage
				if(value == null) storage.remove(prefix+namespace+'.'+key)
				else storage.set(prefix+namespace+'.'+key, value);
			}
			else if(type == 2) {//cookie
				var val = storage.get(prefix+namespace);
				var tmp = val ? JSON.parse(val) : {};

				if(value == null) {
					delete tmp[key];//remove
					if(ace.sizeof(tmp) == 0) {//no other elements in this cookie, so delete it
						storage.remove(prefix+namespace);
						return;
					}
				}
				
				else {
					tmp[key] = value;
				}

				storage.set(prefix+namespace , JSON.stringify(tmp), ace.config.cookie_expiry)
			}
		}
	}

	this.get = function(namespace, key, undefined) {
		if(!storage) return null;
		
		if(key === undefined) {//no namespace here?
			key = namespace;
			return storage.get(prefix+key);
		}
		else {
			if(type == 1) {//localStorage
				return storage.get(prefix+namespace+'.'+key);
			}
			else if(type == 2) {//cookie
				var val = storage.get(prefix+namespace);
				var tmp = val ? JSON.parse(val) : {};
				return key in tmp ? tmp[key] : null;
			}
		}
	}

	
	this.remove = function(namespace, key, undefined) {
		if(!storage) return;
		
		if(key === undefined) {
			key = namespace
			this.set(key, null);
		}
		else {
			this.set(namespace, key, null);
		}
	}
}





//cookie storage
ace.cookie = {
	// The following functions are from Cookie.js class in TinyMCE, Moxiecode, used under LGPL.

	/**
	 * Get a cookie.
	 */
	get : function(name) {
		var cookie = document.cookie, e, p = name + "=", b;

		if ( !cookie )
			return;

		b = cookie.indexOf("; " + p);

		if ( b == -1 ) {
			b = cookie.indexOf(p);

			if ( b != 0 )
				return null;

		} else {
			b += 2;
		}

		e = cookie.indexOf(";", b);

		if ( e == -1 )
			e = cookie.length;

		return decodeURIComponent( cookie.substring(b + p.length, e) );
	},

	/**
	 * Set a cookie.
	 *
	 * The 'expires' arg can be either a JS Date() object set to the expiration date (back-compat)
	 * or the number of seconds until expiration
	 */
	set : function(name, value, expires, path, domain, secure) {
		var d = new Date();

		if ( typeof(expires) == 'object' && expires.toGMTString ) {
			expires = expires.toGMTString();
		} else if ( parseInt(expires, 10) ) {
			d.setTime( d.getTime() + ( parseInt(expires, 10) * 1000 ) ); // time must be in miliseconds
			expires = d.toGMTString();
		} else {
			expires = '';
		}

		document.cookie = name + "=" + encodeURIComponent(value) +
			((expires) ? "; expires=" + expires : "") +
			((path) ? "; path=" + path : "") +
			((domain) ? "; domain=" + domain : "") +
			((secure) ? "; secure" : "");
	},

	/**
	 * Remove a cookie.
	 *
	 * This is done by setting it to an empty value and setting the expiration time in the past.
	 */
	remove : function(name, path) {
		this.set(name, '', -1000, path);
	}
};


//local storage
ace.storage = {
	get: function(key) {
		return window['localStorage'].getItem(key);
	},
	set: function(key, value) {
		window['localStorage'].setItem(key , value);
	},
	remove: function(key) {
		window['localStorage'].removeItem(key);
	}
};






//count the number of properties in an object
//useful for getting the number of elements in an associative array
ace.sizeof = function(obj) {
	var size = 0;
	for(var key in obj) if(obj.hasOwnProperty(key)) size++;
	return size;
}

//because jQuery may not be loaded at this stage, we use our own toggleClass
ace.hasClass = function(elem, className) {
	return (" " + elem.className + " ").indexOf(" " + className + " ") > -1;
}
ace.addClass = function(elem, className) {
 if (!ace.hasClass(elem, className)) {
	var currentClass = elem.className;
	elem.className = currentClass + (currentClass.length? " " : "") + className;
 }
}
ace.removeClass = function(elem, className) {ace.replaceClass(elem, className);}

ace.replaceClass = function(elem, className, newClass) {
	var classToRemove = new RegExp(("(^|\\s)" + className + "(\\s|$)"), "i");
	elem.className = elem.className.replace(classToRemove, function (match, p1, p2) {
		return newClass? (p1 + newClass + p2) : " ";
	}).replace(/^\s+|\s+$/g, "");
}

ace.toggleClass = function(elem, className) {
	if(ace.hasClass(elem, className))
		ace.removeClass(elem, className);
	else ace.addClass(elem, className);
}




//data_storage instance used inside ace.settings etc
ace.data = new ace.data_storage(ace.config.storage_method);

if(! ('ace' in window) ) window['ace'] = {}
jQuery(function() {
	//at some places we try to use 'tap' event instead of 'click' if jquery mobile plugin is available
	window['ace'].click_event = $.fn.tap ? "tap" : "click";
});

(function($ , undefined) {
	var multiplible = 'multiple' in document.createElement('INPUT');
	var hasFileList = 'FileList' in window;//file list enabled in modern browsers
	var hasFileReader = 'FileReader' in window;

	var Ace_File_Input = function(element , settings) {
		var self = this;
		this.settings = $.extend({}, $.fn.ace_file_input.defaults, settings);

		this.$element = $(element);
		this.element = element;
		this.disabled = false;
		this.can_reset = true;

		this.$element.on('change.ace_inner_call', function(e , ace_inner_call){
			if(ace_inner_call === true) return;//this change event is called from above drop event
			return handle_on_change.call(self);
		});
		
		this.$element.wrap('<div class="ace-file-input" />');
		
		this.apply_settings();
	}
	Ace_File_Input.error = {
		'FILE_LOAD_FAILED' : 1,
		'IMAGE_LOAD_FAILED' : 2,
		'THUMBNAIL_FAILED' : 3
	};


	Ace_File_Input.prototype.apply_settings = function() {
		var self = this;
		var remove_btn = !!this.settings.icon_remove;

		this.multi = this.$element.attr('multiple') && multiplible;
		this.well_style = this.settings.style == 'well';

		if(this.well_style) this.$element.parent().addClass('ace-file-multiple');
		 else this.$element.parent().removeClass('ace-file-multiple');

		this.$element.parent().find(':not(input[type=file])').remove();//remove all except our input, good for when changing settings
		this.$element.after('<label data-title="'+this.settings.btn_choose+'"><span data-title="'+this.settings.no_file+'">'+(this.settings.no_icon ? '<i class="'+this.settings.no_icon+'"></i>' : '')+'</span></label>'+(remove_btn ? '<a class="remove" href="#"><i class="'+this.settings.icon_remove+'"></i></a>' : ''));
		this.$label = this.$element.next();

		this.$label.on('click', function(){//firefox mobile doesn't allow 'tap'!
			if(!this.disabled && !self.element.disabled && !self.$element.attr('readonly')) 
				self.$element.click();
		})

		if(remove_btn) this.$label.next('a').on(ace.click_event, function(){
			if(! self.can_reset ) return false;
			
			var ret = true;
			if(self.settings.before_remove) ret = self.settings.before_remove.call(self.element);
			if(!ret) return false;
			return self.reset_input();
		});


		if(this.settings.droppable && hasFileList) {
			enable_drop_functionality.call(this);
		}
	}

	Ace_File_Input.prototype.show_file_list = function($files) {
		var files = typeof $files === "undefined" ? this.$element.data('ace_input_files') : $files;
		if(!files || files.length == 0) return;

		//////////////////////////////////////////////////////////////////

		if(this.well_style) {
			this.$label.find('span').remove();
			if(!this.settings.btn_change) this.$label.addClass('hide-placeholder');
		}
		this.$label.attr('data-title', this.settings.btn_change).addClass('selected');
		
		for (var i = 0; i < files.length; i++) {
			var filename = typeof files[i] === "string" ? files[i] : $.trim( files[i].name );
			var index = filename.lastIndexOf("\\") + 1;
			if(index == 0)index = filename.lastIndexOf("/") + 1;
			filename = filename.substr(index);
			
			var fileIcon = 'icon-file';
			if((/\.(jpe?g|png|gif|svg|bmp|tiff?)$/i).test(filename)) {
				fileIcon = 'icon-picture';
			}
			else if((/\.(mpe?g|flv|mov|avi|swf|mp4|mkv|webm|wmv|3gp)$/i).test(filename)) fileIcon = 'icon-film';
			else if((/\.(mp3|ogg|wav|wma|amr|aac)$/i).test(filename)) fileIcon = 'icon-music';


			if(!this.well_style) this.$label.find('span').attr({'data-title':filename}).find('[class*="icon-"]').attr('class', fileIcon);
			else {
				this.$label.append('<span data-title="'+filename+'"><i class="'+fileIcon+'"></i></span>');
				var type = $.trim(files[i].type);
				var can_preview = hasFileReader && this.settings.thumbnail 
						&&
						( (type.length > 0 && type.match('image')) || (type.length == 0 && fileIcon == 'icon-picture') )//the second one is for Android's default browser which gives an empty text for file.type
				if(can_preview) {
					var self = this;
					$.when(preview_image.call(this, files[i])).fail(function(result){
						//called on failure to load preview
						if(self.settings.preview_error) self.settings.preview_error.call(self, filename, result.code);
					});
				}
			}

		}

		return true;
	}

	Ace_File_Input.prototype.reset_input = function() {
	  this.$label.attr({'data-title':this.settings.btn_choose, 'class':''})
			.find('span:first').attr({'data-title':this.settings.no_file , 'class':''})
			.find('[class*="icon-"]').attr('class', this.settings.no_icon)
			.prev('img').remove();
			if(!this.settings.no_icon) this.$label.find('[class*="icon-"]').remove();
		
		this.$label.find('span').not(':first').remove();
		
		if(this.$element.data('ace_input_files')) {
			this.$element.removeData('ace_input_files');
			this.$element.removeData('ace_input_method');
		}

		this.reset_input_field();
		
		return false;
	}

	Ace_File_Input.prototype.reset_input_field = function() {
		//http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery/13351234#13351234
		this.$element.wrap('<form>').closest('form').get(0).reset();
		this.$element.unwrap();
	}
	
	Ace_File_Input.prototype.enable_reset = function(can_reset) {
		this.can_reset = can_reset;
	}

	Ace_File_Input.prototype.disable = function() {
		this.disabled = true;
		this.$element.attr('disabled', 'disabled').addClass('disabled');
	}
	Ace_File_Input.prototype.enable = function() {
		this.disabled = false;
		this.$element.removeAttr('disabled').removeClass('disabled');
	}
	
	Ace_File_Input.prototype.files = function() {
		return $(this).data('ace_input_files') || null;
	}
	Ace_File_Input.prototype.method = function() {
		return $(this).data('ace_input_method') || '';
	}
	
	Ace_File_Input.prototype.update_settings = function(new_settings) {
		this.settings = $.extend({}, this.settings, new_settings);
		this.apply_settings();
	}



	var enable_drop_functionality = function() {
		var self = this;
		var dropbox = this.element.parentNode;		
		$(dropbox).on('dragenter', function(e){
			e.preventDefault();
			e.stopPropagation();
		}).on('dragover', function(e){
			e.preventDefault();
			e.stopPropagation();
		}).on('drop', function(e){
			e.preventDefault();
			e.stopPropagation();

			var dt = e.originalEvent.dataTransfer;
			var files = dt.files;
			if(!self.multi && files.length > 1) {//single file upload, but dragged multiple files
				var tmpfiles = [];
				tmpfiles.push(files[0]);
				files = tmpfiles;//keep only first file
			}
			
			var ret = true;
			if(self.settings.before_change) ret = self.settings.before_change.call(self.element, files, true);//true means files have been dropped
			if(!ret || ret.length == 0) {
				return false;
			}
			
			//user can return a modified File Array as result
			if(ret instanceof Array || (hasFileList && ret instanceof FileList)) files = ret;
			
			
			self.$element.data('ace_input_files', files);//save files data to be used later by user
			self.$element.data('ace_input_method', 'drop');


			self.show_file_list(files);
			
			
			self.$element.triggerHandler('change' , [true]);//true means inner_call
			return true;
		});
	}
	
	
	var handle_on_change = function() {
		var ret = true;
		if(this.settings.before_change) ret = this.settings.before_change.call(this.element, this.element.files || [this.element.value]/*make it an array*/, false);//false means files have been selected, not dropped
		if(!ret || ret.length == 0) {
			if(!this.$element.data('ace_input_files')) this.reset_input_field();//if nothing selected before, reset because of the newly unacceptable (ret=false||length=0) selection
			return false;
		}
		

		//user can return a modified File Array as result
		var files = !hasFileList ? null ://for old IE, etc
					((ret instanceof Array || ret instanceof FileList) ? ret : this.element.files);
		this.$element.data('ace_input_method', 'select');


		if(files && files.length > 0) {//html5
			this.$element.data('ace_input_files', files);
		}
		else {
			var name = $.trim( this.element.value );
			if(name && name.length > 0) {
				files = []
				files.push(name);
				this.$element.data('ace_input_files', files);
			}
		}

		if(!files || files.length == 0) return false;
		this.show_file_list(files);

		return true;
	}




	var preview_image = function(file) {
		var self = this;
		var $span = self.$label.find('span:last');//it should be out of onload, otherwise all onloads may target the same span because of delays
		
		var deferred = new $.Deferred
		var reader = new FileReader();
		reader.onload = function (e) {
			$span.prepend("<img class='middle' style='display:none;' />");
			var img = $span.find('img:last').get(0);

			$(img).one('load', function() {
				//if image loaded successfully
				var size = 50;
				if(self.settings.thumbnail == 'large') size = 150;
				else if(self.settings.thumbnail == 'fit') size = $span.width();
				$span.addClass(size > 50 ? 'large' : '');

				var thumb = get_thumbnail(img, size, file.type);
				if(thumb == null) {
					//if making thumbnail fails
					$(this).remove();
					deferred.reject({code:Ace_File_Input.error['THUMBNAIL_FAILED']});
					return;
				}

				var w = thumb.w, h = thumb.h;
				if(self.settings.thumbnail == 'small') {w=h=size;};
				$(img).css({'background-image':'url('+thumb.src+')' , width:w, height:h})									
						.data('thumb', thumb.src)
						.attr({src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg=='})
						.show()

				///////////////////
				deferred.resolve();
			}).one('error', function() {
				//for example when a file has image extenstion, but format is something else
				$span.find('img').remove();
				deferred.reject({code:Ace_File_Input.error['IMAGE_LOAD_FAILED']});
			});

			img.src = e.target.result;
		}
		reader.onerror = function (e) {
			deferred.reject({code:Ace_File_Input.error['FILE_LOAD_FAILED']});
		}
		reader.readAsDataURL(file);

		return deferred.promise();
	}

	var get_thumbnail = function(img, size, type) {
		
		var w = img.width, h = img.height;
		if(w > size || h > size) {
		  if(w > h) {
			h = parseInt(size/w * h);
			w = size;
		  } else {
			w = parseInt(size/h * w);
			h = size;
		  }
		}

		var dataURL
		try {
			var canvas = document.createElement('canvas');
			canvas.width = w; canvas.height = h;
			var context = canvas.getContext('2d');
			context.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
			dataURL = canvas.toDataURL(/*type == 'image/jpeg' ? type : 'image/png', 10*/)
		} catch(e) {
			dataURL = null;
		}

		//there was only one image that failed in firefox completely randomly! so let's double check it
		if(!( /^data\:image\/(png|jpe?g|gif);base64,[0-9A-Za-z\+\/\=]+$/.test(dataURL)) ) dataURL = null;
		if(! dataURL) return null;

		return {src: dataURL, w:w, h:h};
	}



	///////////////////////////////////////////
	$.fn.ace_file_input = function (option,value) {
		var retval;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_file_input');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_file_input', (data = new Ace_File_Input(this, options)));
			if (typeof option === 'string') retval = data[option](value);
		});

		return (retval === undefined) ? $set : retval;
	};


	$.fn.ace_file_input.defaults = {
		style:false,
		no_file:'No File ...',
		no_icon:'icon-upload-alt',
		btn_choose:'Choose',
		btn_change:'Change',
		icon_remove:'icon-remove',
		droppable:false,
		thumbnail:false,//large, fit, small
		
		//callbacks
		before_change:null,
		before_remove:null,
		preview_error:null
     }


})(window.jQuery);








(function($ , undefined) {
	$.fn.ace_spinner = function(options) {
		
		//when min is negative, the input maxlength does not account for the extra minus sign
		this.each(function() {
			var icon_up = options.icon_up || 'icon-chevron-up';
			var icon_down = options.icon_down || 'icon-chevron-down';
			
			var btn_up_class = options.btn_up_class || '';
			var btn_down_class = options.btn_down_class || '';
		
			var max = options.max || 999;
			max = (''+max).length;
			var $parent_div = 
				$(this).addClass('spinner-input').css('width' , (max*10)+'px').wrap('<div class="ace-spinner">')
				.after('<div class="spinner-buttons btn-group btn-group-vertical">\
						<button type="button" class="btn spinner-up btn-mini '+btn_up_class+'">\
						<i class="'+icon_up+'"></i>\
						</button>\
						<button type="button" class="btn spinner-down btn-mini '+btn_down_class+'">\
						<i class="'+icon_down+'"></i>\
						</button>\
						</div>')
				.closest('.ace-spinner').spinner(options).wrapInner("<div class='input-append'></div>");

			

			$(this).on('mousewheel DOMMouseScroll', function(event){
				var delta = event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0 ? 1 : -1;
				$parent_div.spinner('step', delta > 0);//accepts true or false as second param
				$parent_div.spinner('triggerChangedEvent');
				return false;
			});
			var that = $(this);
			$parent_div.on('changed', function(){
				that.trigger('change');//trigger the input's change event
			});
			
		});
		
		return this;
	}


})(window.jQuery);






(function($ , undefined) {
	$.fn.ace_wizard = function(options) {
		
		this.each(function() {
			var $this = $(this);
			var steps = $this.find('li');
			var numSteps = steps.length;
			var width = (100 / numSteps)+"";
			if(width.length > 6)  width = width.substr(0, 6);
			width += '%';
			steps.css({'min-width':width , 'max-width':width});
			
			$this.show().wizard();

			var buttons = $this.siblings('.wizard-actions').eq(0);
			var $wizard = $this.data('wizard');
			$wizard.$prevBtn.remove();
			$wizard.$nextBtn.remove();
			
			$wizard.$prevBtn = buttons.find('.btn-prev').eq(0).on(ace.click_event,  function(){
				$this.wizard('previous');
			}).attr('disabled', 'disabled');
			$wizard.$nextBtn = buttons.find('.btn-next').eq(0).on(ace.click_event,  function(){
				$this.wizard('next');
			}).removeAttr('disabled');
			$wizard.nextText = $wizard.$nextBtn.text();
		});
		
		return this;
	}


})(window.jQuery);





(function($ , undefined) {
	$.fn.ace_colorpicker = function(options) {
		
		var settings = $.extend( {
			pull_right:false,
			caret:true
        }, options);
		
		this.each(function() {
		
			var $that = $(this);
			var colors = '';
			var color = '';
			$(this).hide().find('option').each(function() {
				var $class = 'colorpick-btn';
				if(this.selected) {
					$class += ' selected';
					color = this.value;
				}
				colors += '<li><a class="'+$class+'" href="#" style="background-color:'+this.value+';" data-color="'+this.value+'"></a></li>';
			}).end().on('change.ace_inner_call', function(){
					$(this).next().find('.btn-colorpicker').css('background-color', this.value);
			})
			.after('<div class="dropdown dropdown-colorpicker"><a data-toggle="dropdown" class="dropdown-toggle" href="#"><span class="btn-colorpicker" style="background-color:'+color+'"></span></a><ul class="dropdown-menu'+(settings.caret? ' dropdown-caret' : '')+(settings.pull_right ? ' pull-right' : '')+'">'+colors+'</ul></div>')
			.next().find('.dropdown-menu').on(ace.click_event, function(e) {
				var a = $(e.target);
				if(!a.is('.colorpick-btn')) return false;
				a.closest('ul').find('.selected').removeClass('selected');
				a.addClass('selected');
				var color = a.data('color');

				$that.val(color).change();

				e.preventDefault();
				return true;//if false, dropdown won't hide!
			});
			
			
		});
		return this;
		
	}	
	
	
})(window.jQuery);












(function($ , undefined) {
	$.fn.ace_tree = function(options) {
		var $options = {
			'open-icon' : 'icon-folder-open',
			'close-icon' : 'icon-folder-close',
			'selectable' : true,
			'selected-icon' : 'icon-ok',
			'unselected-icon' : 'tree-dot'
		}
		
		$options = $.extend({}, $options, options)

		this.each(function() {
			var $this = $(this);
			$this.html('<div class = "tree-folder" style="display:none;">\
				<div class="tree-folder-header">\
					<i class="'+$options['close-icon']+'"></i>\
					<div class="tree-folder-name"></div>\
				</div>\
				<div class="tree-folder-content"></div>\
				<div class="tree-loader" style="display:none"></div>\
			</div>\
			<div class="tree-item" style="display:none;">\
				'+($options['unselected-icon'] == null ? '' : '<i class="'+$options['unselected-icon']+'"></i>')+'\
				<div class="tree-item-name"></div>\
			</div>');
			$this.addClass($options['selectable'] == true ? 'tree-selectable' : 'tree-unselectable');
			
			$this.tree($options);
		});

		return this;
	}


})(window.jQuery);












(function($ , undefined) {
	$.fn.ace_wysiwyg = function($options , undefined) {
		var options = $.extend( {
			speech_button:true,
			wysiwyg:{}
        }, $options);

		var color_values = [
			'#ac725e','#d06b64','#f83a22','#fa573c','#ff7537','#ffad46',
			'#42d692','#16a765','#7bd148','#b3dc6c','#fbe983','#fad165',
			'#92e1c0','#9fe1e7','#9fc6e7','#4986e7','#9a9cff','#b99aff',
			'#c2c2c2','#cabdbf','#cca6ac','#f691b2','#cd74e6','#a47ae2',
			'#444444'
		]

		var button_defaults =
		{
			'font' : {
				values:['Arial', 'Courier', 'Comic Sans MS', 'Helvetica', 'Open Sans', 'Tahoma', 'Verdana'],
				icon:'icon-font',
				title:'Font'
			},
			'fontSize' : {
				values:{5:'Huge', 3:'Normal', 1:'Small'},
				icon:'icon-text-height',
				title:'Font Size'
			},
			'bold' : {
				icon : 'icon-bold',
				title : 'Bold (Ctrl/Cmd+B)'
			},
			'italic' : {
				icon : 'icon-italic',
				title : 'Italic (Ctrl/Cmd+I)'
			},
			'strikethrough' : {
				icon : 'icon-strikethrough',
				title : 'Strikethrough'
			},
			'underline' : {
				icon : 'icon-underline',
				title : 'Underline'
			},
			'insertunorderedlist' : {
				icon : 'icon-list-ul',
				title : 'Bullet list'
			},
			'insertorderedlist' : {
				icon : 'icon-list-ol',
				title : 'Number list'
			},
			'outdent' : {
				icon : 'icon-indent-left',
				title : 'Reduce indent (Shift+Tab)'
			},
			'indent' : {
				icon : 'icon-indent-right',
				title : 'Indent (Tab)'
			},
			'justifyleft' : {
				icon : 'icon-align-left',
				title : 'Align Left (Ctrl/Cmd+L)'
			},
			'justifycenter' : {
				icon : 'icon-align-center',
				title : 'Center (Ctrl/Cmd+E)'
			},
			'justifyright' : {
				icon : 'icon-align-right',
				title : 'Align Right (Ctrl/Cmd+R)'
			},
			'justifyfull' : {
				icon : 'icon-align-justify',
				title : 'Justify (Ctrl/Cmd+J)'
			},
			'createLink' : {
				icon : 'icon-link',
				title : 'Hyperlink',
				button_text : 'Add',
				placeholder : 'URL',
				button_class : 'btn-primary'
			},
			'unlink' : {
				icon : 'icon-unlink',
				title : 'Remove Hyperlink'
			},
			'insertImage' : {
				icon : 'icon-picture',
				title : 'Insert picture',
				button_text : '<i class="icon-file"></i> Choose Image &hellip;',
				placeholder : 'Image URL',
				button_insert : 'Insert',
				button_class : 'btn-success',
				button_insert_class : 'btn-primary',
				choose_file: true //show the choose file button?
			},
			'foreColor' : {
				values : color_values,
				title : 'Change Color'
			},
			'backColor' : {
				values : color_values,
				title : 'Change Background Color'
			},
			'undo' : {
				icon : 'icon-undo',
				title : 'Undo (Ctrl/Cmd+Z)'
			},
			'redo' : {
				icon : 'icon-repeat',
				title : 'Redo (Ctrl/Cmd+Y)'
			},
			'viewSource' : {
				icon : 'icon-code',
				title : 'View Source'
			}
		}
		
		var toolbar_buttons =
		options.toolbar ||
		[
			'font',
			null,
			'fontSize',
			null,
			'bold',
			'italic',
			'strikethrough',
			'underline',
			null,
			'insertunorderedlist',
			'insertorderedlist',
			'outdent',
			'indent',
			null,
			'justifyleft',
			'justifycenter',
			'justifyright',
			'justifyfull',
			null,
			'createLink',
			'unlink',
			null,
			'insertImage',
			null,
			'foreColor',
			null,
			'undo',
			'redo',
			null,
			'viewSource'
		]


		this.each(function() {
			var toolbar = ' <div class="wysiwyg-toolbar btn-toolbar center"> <div class="btn-group"> ';

			for(var tb in toolbar_buttons) if(toolbar_buttons.hasOwnProperty(tb)) {
				var button = toolbar_buttons[tb];
				if(button === null){
					toolbar += ' </div> <div class="btn-group"> ';
					continue;
				}
				
				if(typeof button == "string" && button in button_defaults) {
					button = button_defaults[button];
					button.name = toolbar_buttons[tb];
				} else if(typeof button == "object" && button.name in button_defaults) {
					button = $.extend(button_defaults[button.name] , button);
				}
				else continue;
				
				var className = "className" in button ? button.className : '';
				switch(button.name) {
					case 'font':
						toolbar += ' <a class="btn btn-small '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+button.icon+'"></i><i class="icon-angle-down icon-on-right"></i></a> ';
						toolbar += ' <ul class="dropdown-menu dropdown-light">';
						for(var font in button.values)
							if(button.values.hasOwnProperty(font))
								toolbar += ' <li><a data-edit="fontName ' + button.values[font] +'" style="font-family:\''+ button.values[font]  +'\'">'+button.values[font]  + '</a></li> '
						toolbar += ' </ul>';
					break;

					case 'fontSize':
						toolbar += ' <a class="btn btn-small '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+button.icon+'"></i>&nbsp;<i class="icon-angle-down icon-on-right"></i></a> ';
						toolbar += ' <ul class="dropdown-menu dropdown-light"> ';
						for(var size in button.values)
							if(button.values.hasOwnProperty(size))
								toolbar += ' <li><a data-edit="fontSize '+size+'"><font size="'+size+'">'+ button.values[size] +'</font></a></li> '
						toolbar += ' </ul> ';
					break;

					case 'createLink':
						toolbar += ' <div class="inline position-relative"> <a class="btn btn-small '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+button.icon+'"></i></a> ';
						toolbar += ' <div class="dropdown-menu dropdown-caret pull-right">\
							<input placeholder="'+button.placeholder+'" type="text" data-edit="'+button.name+'" />\
							<button class="btn btn-small '+button.button_class+'" type="button">'+button.button_text+'</button>\
						</div> </div>';
					break;

					case 'insertImage':
						toolbar += ' <div class="inline position-relative"> <a class="btn btn-small '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+button.icon+'"></i></a> ';
						toolbar += ' <div class="dropdown-menu dropdown-caret pull-right">\
							<input placeholder="'+button.placeholder+'" type="text" data-edit="'+button.name+'" />\
							<button class="btn btn-small '+button.button_insert_class+'" type="button">'+button.button_insert+'</button> ';
							if( button.choose_file && 'FileReader' in window ) toolbar +=
							 '<div class="center">\
								<button class="btn btn-small '+button.button_class+' wysiwyg-choose-file" type="button">'+button.button_text+'</button>\
								<input type="file" data-edit="'+button.name+'" />\
							  </div>'
						toolbar += ' </div> </div>';
					break;

					case 'foreColor':
					case 'backColor':
						toolbar += ' <select class="hide wysiwyg_colorpicker" title="'+button.title+'"> ';
						for(var color in button.values)
							toolbar += ' <option value="'+button.values[color]+'">'+button.values[color]+'</option> ';
						toolbar += ' </select> ';
						toolbar += ' <input style="display:none;" disabled class="hide" type="text" data-edit="'+button.name+'" /> ';
					break;

					case 'viewSource':
						toolbar += ' <a class="btn btn-small '+className+'" data-view="source" title="'+button.title+'"><i class="'+button.icon+'"></i></a> ';
					break;
					default:
						toolbar += ' <a class="btn btn-small '+className+'" data-edit="'+button.name+'" title="'+button.title+'"><i class="'+button.icon+'"></i></a> ';
					break;
				}
			}
			toolbar += ' </div> </div> ';



			//if we have a function to decide where to put the toolbar, then call that
			if(options.toolbar_place) toolbar = options.toolbar_place.call(this, toolbar);
			//otherwise put it just before our DIV
			else toolbar = $(this).before(toolbar).prev();

			toolbar.find('a[title]').tooltip({animation:false});
			toolbar.find('.dropdown-menu input:not([type=file])').on(ace.click_event, function() {return false})
		    .on('change', function() {$(this).closest('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle')})
			.on('keydown', function (e) {if(e.which == 27) {this.value='';$(this).change()}});
			toolbar.find('input[type=file]').prev().on(ace.click_event, function (e) { 
				$(this).next().click();
			});
			toolbar.find('.wysiwyg_colorpicker').each(function() {
				$(this).ace_colorpicker({pull_right:true}).change(function(){
					$(this).nextAll('input').eq(0).val(this.value).change();
				}).next().find('.btn-colorpicker').tooltip({title: this.title, animation:false})
			});
			
			var speech_input;
			if (options.speech_button && 'onwebkitspeechchange' in (speech_input = document.createElement('input'))) {
				var editorOffset = $(this).offset();
				toolbar.append(speech_input);
				$(speech_input).attr({type:'text', 'data-edit':'inserttext','x-webkit-speech':''}).addClass('wysiwyg-speech-input')
				.css({'position':'absolute'}).offset({top: editorOffset.top, left: editorOffset.left+$(this).innerWidth()-35});
			} else speech_input = null
			
			
			//view source
			var self = $(this);
			var view_source = false;
			toolbar.find('a[data-view=source]').on('click', function(e){
				e.preventDefault();
				
				if(!view_source) {
					$('<textarea />')
					.css({'width':self.width()-3, 'height':self.height()-1})
					.val(self.html())
					.insertAfter(self)
					self.hide();
					
					$(this).addClass('active');
				}
				else {
					var textarea = self.next();
					self.html(textarea.val()).show();
					textarea.remove();
					
					$(this).removeClass('active');
				}
				
				view_source = !view_source;
			});


			var $options = $.extend({}, { activeToolbarClass: 'active' , toolbarSelector : toolbar }, options.wysiwyg || {})
			$(this).wysiwyg( $options );
		});

		return this;
	}


})(window.jQuery);
if(! ('ace' in window) ) window['ace'] = {}
jQuery(function($) {
	//at some places we try to use 'tap' event instead of 'click' if jquery mobile plugin is available
	window['ace'].click_event = $.fn.tap ? "tap" : "click";
});

jQuery(function($) {
	//ace.click_event defined in ace-elements.js
	ace.handle_side_menu(jQuery);

	//ace.enable_search_ahead(jQuery);

	ace.general_things(jQuery);//and settings

	ace.widget_boxes(jQuery);

	/**
	//make sidebar scrollbar when it is fixed and some parts of it is out of view
	//>> you should include jquery-ui and slimscroll javascript files in your file
	//>> you can call this function when sidebar is clicked to be fixed
	$('.nav-list').slimScroll({
		height: '400px',
		distance:0,
		size : '6px'
	});
	*/
});



ace.handle_side_menu = function($) {
	$('#menu-toggler').on(ace.click_event, function() {
		$('#sidebar').toggleClass('display');
		$(this).toggleClass('display');
		return false;
	});
	//mini
	var $minimized = $('#sidebar').hasClass('menu-min');
	$('#sidebar-collapse').on(ace.click_event, function(){
		$minimized = $('#sidebar').hasClass('menu-min');
		ace.settings.sidebar_collapsed(!$minimized);//@ ace-extra.js
	});

	var touch = "ontouchend" in document;
	//opening submenu
	$('.nav-list').on(ace.click_event, function(e){
		//check to see if we have clicked on an element which is inside a .dropdown-toggle element?!
		//if so, it means we should toggle a submenu
		var link_element = $(e.target).closest('a');
		if(!link_element || link_element.length == 0) return;//if not clicked inside a link element
		
		$minimized = $('#sidebar').hasClass('menu-min');
		
		if(! link_element.hasClass('dropdown-toggle') ) {//it doesn't have a submenu return
			//just one thing before we return
			//if sidebar is collapsed(minimized) and we click on a first level menu item
			//and the click is on the icon, not on the menu text then let's cancel event and cancel navigation
			//Good for touch devices, that when the icon is tapped to see the menu text, navigation is cancelled
			//navigation is only done when menu text is tapped
			if($minimized && ace.click_event == "tap" &&
				link_element.get(0).parentNode.parentNode == this /*.nav-list*/ )//i.e. only level-1 links
			{
					var text = link_element.find('.menu-text').get(0);
					if( e.target != text && !$.contains(text , e.target) )//not clicking on the text or its children
					  return false;
			}

			return;
		}
		//
		var sub = link_element.next().get(0);

		//if we are opening this submenu, close all other submenus except the ".active" one
		if(! $(sub).is(':visible') ) {//if not open and visible, let's open it and make it visible
		  var parent_ul = $(sub.parentNode).closest('ul');
		  if($minimized && parent_ul.hasClass('nav-list')) return;
		  
		  parent_ul.find('> .open > .submenu').each(function(){
			//close all other open submenus except for the active one
			if(this != sub && !$(this.parentNode).hasClass('active')) {
				$(this).slideUp(200).parent().removeClass('open');
				
				//uncomment the following line to close all submenus on deeper levels when closing a submenu
				//$(this).find('.open > .submenu').slideUp(0).parent().removeClass('open');
			}
		  });
		} else {
			//uncomment the following line to close all submenus on deeper levels when closing a submenu
			//$(sub).find('.open > .submenu').slideUp(0).parent().removeClass('open');
		}

		if($minimized && $(sub.parentNode.parentNode).hasClass('nav-list')) return false;

		$(sub).slideToggle(200).parent().toggleClass('open');
		return false;
	 })
}



ace.general_things = function($) {
 $('.ace-nav [class*="icon-animated-"]').closest('a').on('click', function(){
	var icon = $(this).find('[class*="icon-animated-"]').eq(0);
	var $match = icon.attr('class').match(/icon\-animated\-([\d\w]+)/);
	icon.removeClass($match[0]);
	$(this).off('click');
 });
 
 //$('.nav-list .badge[title],.nav-list .label[title]').tooltip({'placement':'right'});



 //simple settings

 $('#ace-settings-btn').on(ace.click_event, function(){
	$(this).toggleClass('open');
	$('#ace-settings-box').toggleClass('open');
 });


/* $('#ace-settings-navbar').on('click', function(){
	ace.settings.navbar_fixed(this.checked);//@ ace-extra.js
 }).get(0).checked = ace.settings.is('navbar', 'fixed')

 $('#ace-settings-sidebar').on('click', function(){
	ace.settings.sidebar_fixed(this.checked);//@ ace-extra.js
 }).get(0).checked = ace.settings.is('sidebar', 'fixed')
 
 $('#ace-settings-breadcrumbs').on('click', function(){
	ace.settings.breadcrumbs_fixed(this.checked);//@ ace-extra.js
 }).get(0).checked = ace.settings.is('breadcrumbs', 'fixed')


 //Switching to RTL (right to left) Mode
 $('#ace-settings-rtl').removeAttr('checked').on('click', function(){
	ace.switch_direction(jQuery);
 });*/


 $('#btn-scroll-up').on(ace.click_event, function(){
	var duration = Math.max(100, parseInt($('html').scrollTop() / 3));
	$('html,body').animate({scrollTop: 0}, duration);
	return false;
 });
 
  try {
	$('#skin-colorpicker').ace_colorpicker();
  } catch(e) {}

  $('#skin-colorpicker').on('change', function(){
	var skin_class = $(this).find('option:selected').data('skin');

	var body = $(document.body);
	body.removeClass('skin-1 skin-2 skin-3');


	if(skin_class != 'default') body.addClass(skin_class);

	if(skin_class == 'skin-1') {
		$('.ace-nav > li.grey').addClass('dark');
	}
	else {
		$('.ace-nav > li.grey').removeClass('dark');
	}

	if(skin_class == 'skin-2') {
		$('.ace-nav > li').addClass('no-border margin-1');
		$('.ace-nav > li:not(:last-child)').addClass('light-pink').find('> a > [class*="icon-"]').addClass('pink').end().eq(0).find('.badge').addClass('badge-warning');
	}
	else {
		$('.ace-nav > li').removeClass('no-border margin-1');
		$('.ace-nav > li:not(:last-child)').removeClass('light-pink').find('> a > [class*="icon-"]').removeClass('pink').end().eq(0).find('.badge').removeClass('badge-warning');
	}

	if(skin_class == 'skin-3') {
		$('.ace-nav > li.grey').addClass('red').find('.badge').addClass('badge-yellow');
	} else {
		$('.ace-nav > li.grey').removeClass('red').find('.badge').removeClass('badge-yellow');
	}
 });
 
}



ace.widget_boxes = function($) {
	$('.page-content,#page-content').delegate('.widget-toolbar > [data-action]' , 'click', function(ev) {
		ev.preventDefault();

		var $this = $(this);
		var $action = $this.data('action');
		var $box = $this.closest('.widget-box');

		if($box.hasClass('ui-sortable-helper')) return;

		if($action == 'collapse') {
			var $body = $box.find('.widget-body');
			var $icon = $this.find('[class*=icon-]').eq(0);
			var $match = $icon.attr('class').match(/icon\-(.*)\-(up|down)/);
			var $icon_down = 'icon-'+$match[1]+'-down';
			var $icon_up = 'icon-'+$match[1]+'-up';
			
			var $body_inner = $body.find('.widget-body-inner')
			if($body_inner.length == 0) {
				$body = $body.wrapInner('<div class="widget-body-inner"></div>').find(':first-child').eq(0);
			} else $body = $body_inner.eq(0);


			var expandSpeed   = 300;
			var collapseSpeed = 200;

			if($box.hasClass('collapsed')) {
				if($icon) $icon.addClass($icon_up).removeClass($icon_down);
				$box.removeClass('collapsed');
				$body.slideUp(0 , function(){$body.slideDown(expandSpeed)});
			}
			else {
				if($icon) $icon.addClass($icon_down).removeClass($icon_up);
				$body.slideUp(collapseSpeed, function(){$box.addClass('collapsed')});
			}
		}
		else if($action == 'close') {
			var closeSpeed = parseInt($this.data('close-speed')) || 300;
			$box.hide(closeSpeed , function(){$box.remove()});
		}
		else if($action == 'reload') {
			$this.blur();

			var $remove = false;
			if($box.css('position') == 'static') {$remove = true; $box.addClass('position-relative');}
			$box.append('<div class="widget-box-layer"><i class="icon-spinner icon-spin icon-2x white"></i></div>');
			setTimeout(function(){
				$box.find('.widget-box-layer').remove();
				if($remove) $box.removeClass('position-relative');
			}, parseInt(Math.random() * 1000 + 1000));
		}
		else if($action == 'settings') {

		}

	});
}



/*//search box's dropdown autocomplete
ace.enable_search_ahead = function($) {
	ace.variable_US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Dakota","North Carolina","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],
	$('#nav-search-input').typeahead({
		source: ace.variable_US_STATES,
		updater:function (item) {
			$('#nav-search-input').focus();
			return item;
		}
	});
}*/



ace.switch_direction = function($) {
	var $body = $(document.body);
	$body
	.toggleClass('rtl')
	//toggle pull-right class on dropdown-menu
	.find('.dropdown-menu:not(.datepicker-dropdown,.colorpicker)').toggleClass('pull-right')
	.end()
	//swap pull-left & pull-right
	.find('.pull-right:not(.dropdown-menu,blockquote,.dropdown-submenu,.profile-skills .pull-right,.control-group .controls > [class*="span"]:first-child)').removeClass('pull-right').addClass('tmp-rtl-pull-right')
	.end()
	.find('.pull-left:not(.dropdown-submenu,.profile-skills .pull-left)').removeClass('pull-left').addClass('pull-right')
	.end()
	.find('.tmp-rtl-pull-right').removeClass('tmp-rtl-pull-right').addClass('pull-left')
	.end()
	
	.find('.chosen-container').toggleClass('chosen-rtl')
	.end()

	.find('.control-group .controls > [class*="span"]:first-child').toggleClass('pull-right')
	.end()
	
	function swap_classes(class1, class2) {
		$body
		 .find('.'+class1).removeClass(class1).addClass('tmp-rtl-'+class1)
		 .end()
		 .find('.'+class2).removeClass(class2).addClass(class1)
		 .end()
		 .find('.tmp-rtl-'+class1).removeClass('tmp-rtl-'+class1).addClass(class2)
	}
	function swap_styles(style1, style2, elements) {
		elements.each(function(){
			var e = $(this);
			var tmp = e.css(style2);
			e.css(style2 , e.css(style1));
			e.css(style1 , tmp);
		});
	}

	swap_classes('align-left', 'align-right');
	swap_classes('arrowed', 'arrowed-right');
	swap_classes('arrowed-in', 'arrowed-in-right');
	swap_classes('messagebar-item-left', 'messagebar-item-right');//for inbox page


	//redraw the traffic pie chart on homepage with a different parameter
	var placeholder = $('#piechart-placeholder');
	if(placeholder.size() > 0) {
		var pos = $(document.body).hasClass('rtl') ? 'nw' : 'ne';//draw on north-west or north-east?
		placeholder.data('draw').call(placeholder.get(0) , placeholder, placeholder.data('chart'), pos);
	}
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjZS1leHRyYS5qcyIsImFjZS1lbGVtZW50cy5qcyIsImFjZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2oyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ0aGlyZHBhcnR5X2N1c3RvbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmKCEgKCdhY2UnIGluIHdpbmRvdykgKSB3aW5kb3dbJ2FjZSddID0ge31cblxuYWNlLmNvbmZpZyA9IHtcbiBjb29raWVfZXhwaXJ5IDogNjA0ODAwLCAvLzEgd2VlayBkdXJhdGlvbiBmb3Igc2F2ZWQgc2V0dGluZ3NcbiBzdG9yYWdlX21ldGhvZDogMiAvLzIgbWVhbnMgdXNlIGNvb2tpZXMsIDEgbWVhbnMgbG9jYWxTdG9yYWdlLCAwIG1lYW5zIGxvY2FsU3RvcmFnZSBpZiBhdmFpbGFibGUgb3RoZXJ3aXNlIGNvb2tpZXNcbn1cblxuYWNlLnNldHRpbmdzID0ge1xuXHRpcyA6IGZ1bmN0aW9uKGl0ZW0sIHN0YXR1cykge1xuXHRcdC8vc3VjaCBhcyBhY2Uuc2V0dGluZ3MuaXMoJ25hdmJhcicsICdmaXhlZCcpXG5cdFx0cmV0dXJuIChhY2UuZGF0YS5nZXQoJ3NldHRpbmdzJywgaXRlbSsnLScrc3RhdHVzKSA9PSAxKVxuXHR9LFxuXHRleGlzdHMgOiBmdW5jdGlvbihpdGVtLCBzdGF0dXMpIHtcblx0XHRyZXR1cm4gKGFjZS5kYXRhLmdldCgnc2V0dGluZ3MnLCBpdGVtKyctJytzdGF0dXMpICE9PSBudWxsKVxuXHR9LFxuXHRzZXQgOiBmdW5jdGlvbihpdGVtLCBzdGF0dXMpIHtcblx0XHRhY2UuZGF0YS5zZXQoJ3NldHRpbmdzJywgaXRlbSsnLScrc3RhdHVzLCAxKVxuXHR9LFxuXHR1bnNldCA6IGZ1bmN0aW9uKGl0ZW0sIHN0YXR1cykge1xuXHRcdGFjZS5kYXRhLnNldCgnc2V0dGluZ3MnLCBpdGVtKyctJytzdGF0dXMsIC0xKVxuXHR9LFxuXHRyZW1vdmUgOiBmdW5jdGlvbihpdGVtLCBzdGF0dXMpIHtcblx0XHRhY2UuZGF0YS5yZW1vdmUoJ3NldHRpbmdzJywgaXRlbSsnLScrc3RhdHVzKVxuXHR9LFxuXG5cdG5hdmJhcl9maXhlZCA6IGZ1bmN0aW9uKGZpeCkge1xuXHRcdGZpeCA9IGZpeCB8fCBmYWxzZTtcblx0XHRpZighZml4ICYmIGFjZS5zZXR0aW5ncy5pcygnc2lkZWJhcicsICdmaXhlZCcpKSB7XG5cdFx0XHRhY2Uuc2V0dGluZ3Muc2lkZWJhcl9maXhlZChmYWxzZSk7XG5cdFx0fVxuXHRcdFxuXHRcdHZhciBuYXZiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJyk7XG5cdFx0aWYoZml4KSB7XG5cdFx0XHRpZighYWNlLmhhc0NsYXNzKG5hdmJhciAsICduYXZiYXItZml4ZWQtdG9wJykpICBhY2UuYWRkQ2xhc3MobmF2YmFyICwgJ25hdmJhci1maXhlZC10b3AnKTtcblx0XHRcdGlmKCFhY2UuaGFzQ2xhc3MoZG9jdW1lbnQuYm9keSAsICduYXZiYXItZml4ZWQnKSkgIGFjZS5hZGRDbGFzcyhkb2N1bWVudC5ib2R5ICwgJ25hdmJhci1maXhlZCcpO1xuXHRcdFx0XG5cdFx0XHRhY2Uuc2V0dGluZ3Muc2V0KCduYXZiYXInLCAnZml4ZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWNlLnJlbW92ZUNsYXNzKG5hdmJhciAsICduYXZiYXItZml4ZWQtdG9wJyk7XG5cdFx0XHRhY2UucmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSAsICduYXZiYXItZml4ZWQnKTtcblx0XHRcdFxuXHRcdFx0YWNlLnNldHRpbmdzLnVuc2V0KCduYXZiYXInLCAnZml4ZWQnKTtcblx0XHR9XG5cdFx0XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjZS1zZXR0aW5ncy1uYXZiYXInKS5jaGVja2VkID0gZml4O1xuXHR9LFxuXG5cblx0YnJlYWRjcnVtYnNfZml4ZWQgOiBmdW5jdGlvbihmaXgpIHtcblx0XHRmaXggPSBmaXggfHwgZmFsc2U7XG5cdFx0aWYoZml4ICYmICFhY2Uuc2V0dGluZ3MuaXMoJ3NpZGViYXInLCAnZml4ZWQnKSkge1xuXHRcdFx0YWNlLnNldHRpbmdzLnNpZGViYXJfZml4ZWQodHJ1ZSk7XG5cdFx0fVxuXG5cdFx0dmFyIGJyZWFkY3J1bWJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWJzJyk7XG5cdFx0aWYoZml4KSB7XG5cdFx0XHRpZighYWNlLmhhc0NsYXNzKGJyZWFkY3J1bWJzICwgJ2JyZWFkY3J1bWJzLWZpeGVkJykpICBhY2UuYWRkQ2xhc3MoYnJlYWRjcnVtYnMgLCAnYnJlYWRjcnVtYnMtZml4ZWQnKTtcblx0XHRcdGlmKCFhY2UuaGFzQ2xhc3MoZG9jdW1lbnQuYm9keSAsICdicmVhZGNydW1icy1maXhlZCcpKSAgYWNlLmFkZENsYXNzKGRvY3VtZW50LmJvZHkgLCAnYnJlYWRjcnVtYnMtZml4ZWQnKTtcblx0XHRcdFxuXHRcdFx0YWNlLnNldHRpbmdzLnNldCgnYnJlYWRjcnVtYnMnLCAnZml4ZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWNlLnJlbW92ZUNsYXNzKGJyZWFkY3J1bWJzICwgJ2JyZWFkY3J1bWJzLWZpeGVkJyk7XG5cdFx0XHRhY2UucmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSAsICdicmVhZGNydW1icy1maXhlZCcpO1xuXHRcdFx0XG5cdFx0XHRhY2Uuc2V0dGluZ3MudW5zZXQoJ2JyZWFkY3J1bWJzJywgJ2ZpeGVkJyk7XG5cdFx0fVxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY2Utc2V0dGluZ3MtYnJlYWRjcnVtYnMnKS5jaGVja2VkID0gZml4O1xuXHR9LFxuXG5cblx0c2lkZWJhcl9maXhlZCA6IGZ1bmN0aW9uKGZpeCkge1xuXHRcdGZpeCA9IGZpeCB8fCBmYWxzZTtcblx0XHRpZighZml4ICYmIGFjZS5zZXR0aW5ncy5pcygnYnJlYWRjcnVtYnMnLCAnZml4ZWQnKSkge1xuXHRcdFx0YWNlLnNldHRpbmdzLmJyZWFkY3J1bWJzX2ZpeGVkKGZhbHNlKTtcblx0XHR9XG5cblx0XHRpZiggZml4ICYmICFhY2Uuc2V0dGluZ3MuaXMoJ25hdmJhcicsICdmaXhlZCcpICkge1xuXHRcdFx0YWNlLnNldHRpbmdzLm5hdmJhcl9maXhlZCh0cnVlKTtcblx0XHR9XG5cblx0XHR2YXIgc2lkZWJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlYmFyJyk7XG5cdFx0aWYoZml4KSB7XG5cdFx0XHRpZiggIWFjZS5oYXNDbGFzcyhzaWRlYmFyICwgJ3NpZGViYXItZml4ZWQnKSApICBhY2UuYWRkQ2xhc3Moc2lkZWJhciAsICdzaWRlYmFyLWZpeGVkJyk7XG5cdFx0XHRhY2Uuc2V0dGluZ3Muc2V0KCdzaWRlYmFyJywgJ2ZpeGVkJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFjZS5yZW1vdmVDbGFzcyhzaWRlYmFyICwgJ3NpZGViYXItZml4ZWQnKTtcblx0XHRcdGFjZS5zZXR0aW5ncy51bnNldCgnc2lkZWJhcicsICdmaXhlZCcpO1xuXHRcdH1cblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNlLXNldHRpbmdzLXNpZGViYXInKS5jaGVja2VkID0gZml4O1xuXHR9LFxuXG5cblx0c2lkZWJhcl9jb2xsYXBzZWQgOiBmdW5jdGlvbihjb2xscGFzZSkge1xuXHRcdGNvbGxwYXNlID0gY29sbHBhc2UgfHwgZmFsc2U7XG5cblx0XHR2YXIgc2lkZWJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlYmFyJyk7XG5cdFx0dmFyIGljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2lkZWJhci1jb2xsYXBzZScpLnF1ZXJ5U2VsZWN0b3IoJ1tjbGFzcyo9XCJpY29uLVwiXScpO1xuXHRcdHZhciAkaWNvbjEgPSBpY29uLmdldEF0dHJpYnV0ZSgnZGF0YS1pY29uMScpOy8vdGhlIGljb24gZm9yIGV4cGFuZGVkIHN0YXRlXG5cdFx0dmFyICRpY29uMiA9IGljb24uZ2V0QXR0cmlidXRlKCdkYXRhLWljb24yJyk7Ly90aGUgaWNvbiBmb3IgY29sbGFwc2VkIHN0YXRlXG5cblx0XHRpZihjb2xscGFzZSkge1xuXHRcdFx0YWNlLmFkZENsYXNzKHNpZGViYXIgLCAnbWVudS1taW4nKTtcblx0XHRcdGFjZS5yZW1vdmVDbGFzcyhpY29uICwgJGljb24xKTtcblx0XHRcdGFjZS5hZGRDbGFzcyhpY29uICwgJGljb24yKTtcblxuXHRcdFx0YWNlLnNldHRpbmdzLnNldCgnc2lkZWJhcicsICdjb2xsYXBzZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWNlLnJlbW92ZUNsYXNzKHNpZGViYXIgLCAnbWVudS1taW4nKTtcblx0XHRcdGFjZS5yZW1vdmVDbGFzcyhpY29uICwgJGljb24yKTtcblx0XHRcdGFjZS5hZGRDbGFzcyhpY29uICwgJGljb24xKTtcblxuXHRcdFx0YWNlLnNldHRpbmdzLnVuc2V0KCdzaWRlYmFyJywgJ2NvbGxhcHNlZCcpO1xuXHRcdH1cblxuXHR9LFxuXHQvKipcblx0c2VsZWN0X3NraW4gOiBmdW5jdGlvbihza2luKSB7XG5cdH1cblx0Ki9cbn1cblxuXG4vL2NoZWNrIHRoZSBzdGF0dXMgb2Ygc29tZXRoaW5nXG5hY2Uuc2V0dGluZ3MuY2hlY2sgPSBmdW5jdGlvbihpdGVtLCB2YWwpIHtcblx0aWYoISBhY2Uuc2V0dGluZ3MuZXhpc3RzKGl0ZW0sIHZhbCkgKSByZXR1cm47Ly9ubyBzdWNoIHNldHRpbmcgc3BlY2lmaWVkXG5cdHZhciBzdGF0dXMgPSBhY2Uuc2V0dGluZ3MuaXMoaXRlbSwgdmFsKTsvL2lzIGJyZWFkY3J1bWJzLWZpeGVkPyBvciBpcyBzaWRlYmFyLWNvbGxhcHNlZD8gZXRjXG5cdFxuXHR2YXIgbXVzdEhhdmVDbGFzcyA9IHtcblx0XHQnbmF2YmFyLWZpeGVkJyA6ICduYXZiYXItZml4ZWQtdG9wJyxcblx0XHQnc2lkZWJhci1maXhlZCcgOiAnc2lkZWJhci1maXhlZCcsXG5cdFx0J2JyZWFkY3J1bWJzLWZpeGVkJyA6ICdicmVhZGNydW1icy1maXhlZCcsXG5cdFx0J3NpZGViYXItY29sbGFwc2VkJyA6ICdtZW51LW1pbidcblx0fVxuXG5cblx0Ly9pZiBhbiBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhIHNwZWNpZmllZCBjbGFzcywgYnV0IHNhdmVkIHNldHRpbmdzIHNheSBpdCBzaG91bGQsIHRoZW4gYWRkIGl0XG5cdC8vZm9yIGV4YW1wbGUsIHNpZGViYXIgaXNuJ3QgLmZpeGVkLCBidXQgdXNlciBmaXhlZCBpdCBvbiBhIHByZXZpb3VzIHBhZ2Vcblx0Ly9vciBpZiBhbiBlbGVtZW50IGhhcyBhIHNwZWNpZmllZCBjbGFzcywgYnV0IHNhdmVkIHNldHRpbmdzIHNheSBpdCBzaG91bGRuJ3QsIHRoZW4gcmVtb3ZlIGl0XG5cdC8vZm9yIGV4YW1wbGUsIHNpZGViYXIgYnkgZGVmYXVsdCBpcyBtaW5pbWl6ZWQgKC5tZW51LW1pbiBoYXJkIGNvZGVkKSwgYnV0IHVzZXIgZXhwYW5kZWQgaXQgYW5kIG5vdyBzaG91bGRuJ3QgaGF2ZSAnbWVudS1taW4nIGNsYXNzXG5cdFxuXHR2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaXRlbSk7Ly8jbmF2YmFyLCAjc2lkZWJhciwgI2JyZWFkY3J1bWJzXG5cdGlmKHN0YXR1cyAhPSBhY2UuaGFzQ2xhc3ModGFyZ2V0ICwgbXVzdEhhdmVDbGFzc1tpdGVtKyctJyt2YWxdKSkge1xuXHRcdGFjZS5zZXR0aW5nc1tpdGVtKydfJyt2YWxdKHN0YXR1cyk7Ly9jYWxsIHRoZSByZWxldmFudCBmdW5jdGlvbiB0byBtYWdlIHRoZSBjaGFuZ2VzXG5cdH1cbn1cblxuXG5cblxuXG5cbi8vc2F2ZS9yZXRyaWV2ZSBkYXRhIHVzaW5nIGxvY2FsU3RvcmFnZSBvciBjb29raWVcbi8vbWV0aG9kID09IDEsIHVzZSBsb2NhbFN0b3JhZ2Vcbi8vbWV0aG9kID09IDIsIHVzZSBjb29raWVzXG4vL21ldGhvZCBub3Qgc3BlY2lmaWVkLCB1c2UgbG9jYWxTdG9yYWdlIGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGNvb2tpZXNcbmFjZS5kYXRhX3N0b3JhZ2UgPSBmdW5jdGlvbihtZXRob2QsIHVuZGVmaW5lZCkge1xuXHR2YXIgcHJlZml4ID0gJ2FjZS4nO1xuXG5cdHZhciBzdG9yYWdlID0gbnVsbDtcblx0dmFyIHR5cGUgPSAwO1xuXHRcblx0aWYoKG1ldGhvZCA9PSAxIHx8IG1ldGhvZCA9PT0gdW5kZWZpbmVkKSAmJiAnbG9jYWxTdG9yYWdlJyBpbiB3aW5kb3cgJiYgd2luZG93Wydsb2NhbFN0b3JhZ2UnXSAhPT0gbnVsbCkge1xuXHRcdHN0b3JhZ2UgPSBhY2Uuc3RvcmFnZTtcblx0XHR0eXBlID0gMTtcblx0fVxuXHRlbHNlIGlmKHN0b3JhZ2UgPT0gbnVsbCAmJiAobWV0aG9kID09IDIgfHwgbWV0aG9kID09PSB1bmRlZmluZWQpICYmICdjb29raWUnIGluIGRvY3VtZW50ICYmIGRvY3VtZW50Wydjb29raWUnXSAhPT0gbnVsbCkge1xuXHRcdHN0b3JhZ2UgPSBhY2UuY29va2llO1xuXHRcdHR5cGUgPSAyO1xuXHR9XG5cblx0Ly92YXIgZGF0YSA9IHt9XG5cdHRoaXMuc2V0ID0gZnVuY3Rpb24obmFtZXNwYWNlLCBrZXksIHZhbHVlLCB1bmRlZmluZWQpIHtcblx0XHRpZighc3RvcmFnZSkgcmV0dXJuO1xuXHRcdFxuXHRcdGlmKHZhbHVlID09PSB1bmRlZmluZWQpIHsvL25vIG5hbWVzcGFjZSBoZXJlP1xuXHRcdFx0dmFsdWUgPSBrZXk7XG5cdFx0XHRrZXkgPSBuYW1lc3BhY2U7XG5cblx0XHRcdGlmKHZhbHVlID09IG51bGwpIHN0b3JhZ2UucmVtb3ZlKHByZWZpeCtrZXkpXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0aWYodHlwZSA9PSAxKVxuXHRcdFx0XHRcdHN0b3JhZ2Uuc2V0KHByZWZpeCtrZXksIHZhbHVlKVxuXHRcdFx0XHRlbHNlIGlmKHR5cGUgPT0gMilcblx0XHRcdFx0XHRzdG9yYWdlLnNldChwcmVmaXgra2V5LCB2YWx1ZSwgYWNlLmNvbmZpZy5jb29raWVfZXhwaXJ5KVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmKHR5cGUgPT0gMSkgey8vbG9jYWxTdG9yYWdlXG5cdFx0XHRcdGlmKHZhbHVlID09IG51bGwpIHN0b3JhZ2UucmVtb3ZlKHByZWZpeCtuYW1lc3BhY2UrJy4nK2tleSlcblx0XHRcdFx0ZWxzZSBzdG9yYWdlLnNldChwcmVmaXgrbmFtZXNwYWNlKycuJytrZXksIHZhbHVlKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYodHlwZSA9PSAyKSB7Ly9jb29raWVcblx0XHRcdFx0dmFyIHZhbCA9IHN0b3JhZ2UuZ2V0KHByZWZpeCtuYW1lc3BhY2UpO1xuXHRcdFx0XHR2YXIgdG1wID0gdmFsID8gSlNPTi5wYXJzZSh2YWwpIDoge307XG5cblx0XHRcdFx0aWYodmFsdWUgPT0gbnVsbCkge1xuXHRcdFx0XHRcdGRlbGV0ZSB0bXBba2V5XTsvL3JlbW92ZVxuXHRcdFx0XHRcdGlmKGFjZS5zaXplb2YodG1wKSA9PSAwKSB7Ly9ubyBvdGhlciBlbGVtZW50cyBpbiB0aGlzIGNvb2tpZSwgc28gZGVsZXRlIGl0XG5cdFx0XHRcdFx0XHRzdG9yYWdlLnJlbW92ZShwcmVmaXgrbmFtZXNwYWNlKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHRtcFtrZXldID0gdmFsdWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzdG9yYWdlLnNldChwcmVmaXgrbmFtZXNwYWNlICwgSlNPTi5zdHJpbmdpZnkodG1wKSwgYWNlLmNvbmZpZy5jb29raWVfZXhwaXJ5KVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRoaXMuZ2V0ID0gZnVuY3Rpb24obmFtZXNwYWNlLCBrZXksIHVuZGVmaW5lZCkge1xuXHRcdGlmKCFzdG9yYWdlKSByZXR1cm4gbnVsbDtcblx0XHRcblx0XHRpZihrZXkgPT09IHVuZGVmaW5lZCkgey8vbm8gbmFtZXNwYWNlIGhlcmU/XG5cdFx0XHRrZXkgPSBuYW1lc3BhY2U7XG5cdFx0XHRyZXR1cm4gc3RvcmFnZS5nZXQocHJlZml4K2tleSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYodHlwZSA9PSAxKSB7Ly9sb2NhbFN0b3JhZ2Vcblx0XHRcdFx0cmV0dXJuIHN0b3JhZ2UuZ2V0KHByZWZpeCtuYW1lc3BhY2UrJy4nK2tleSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKHR5cGUgPT0gMikgey8vY29va2llXG5cdFx0XHRcdHZhciB2YWwgPSBzdG9yYWdlLmdldChwcmVmaXgrbmFtZXNwYWNlKTtcblx0XHRcdFx0dmFyIHRtcCA9IHZhbCA/IEpTT04ucGFyc2UodmFsKSA6IHt9O1xuXHRcdFx0XHRyZXR1cm4ga2V5IGluIHRtcCA/IHRtcFtrZXldIDogbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRcblx0dGhpcy5yZW1vdmUgPSBmdW5jdGlvbihuYW1lc3BhY2UsIGtleSwgdW5kZWZpbmVkKSB7XG5cdFx0aWYoIXN0b3JhZ2UpIHJldHVybjtcblx0XHRcblx0XHRpZihrZXkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0a2V5ID0gbmFtZXNwYWNlXG5cdFx0XHR0aGlzLnNldChrZXksIG51bGwpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuc2V0KG5hbWVzcGFjZSwga2V5LCBudWxsKTtcblx0XHR9XG5cdH1cbn1cblxuXG5cblxuXG4vL2Nvb2tpZSBzdG9yYWdlXG5hY2UuY29va2llID0ge1xuXHQvLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBhcmUgZnJvbSBDb29raWUuanMgY2xhc3MgaW4gVGlueU1DRSwgTW94aWVjb2RlLCB1c2VkIHVuZGVyIExHUEwuXG5cblx0LyoqXG5cdCAqIEdldCBhIGNvb2tpZS5cblx0ICovXG5cdGdldCA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHR2YXIgY29va2llID0gZG9jdW1lbnQuY29va2llLCBlLCBwID0gbmFtZSArIFwiPVwiLCBiO1xuXG5cdFx0aWYgKCAhY29va2llIClcblx0XHRcdHJldHVybjtcblxuXHRcdGIgPSBjb29raWUuaW5kZXhPZihcIjsgXCIgKyBwKTtcblxuXHRcdGlmICggYiA9PSAtMSApIHtcblx0XHRcdGIgPSBjb29raWUuaW5kZXhPZihwKTtcblxuXHRcdFx0aWYgKCBiICE9IDAgKVxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRiICs9IDI7XG5cdFx0fVxuXG5cdFx0ZSA9IGNvb2tpZS5pbmRleE9mKFwiO1wiLCBiKTtcblxuXHRcdGlmICggZSA9PSAtMSApXG5cdFx0XHRlID0gY29va2llLmxlbmd0aDtcblxuXHRcdHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoIGNvb2tpZS5zdWJzdHJpbmcoYiArIHAubGVuZ3RoLCBlKSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXQgYSBjb29raWUuXG5cdCAqXG5cdCAqIFRoZSAnZXhwaXJlcycgYXJnIGNhbiBiZSBlaXRoZXIgYSBKUyBEYXRlKCkgb2JqZWN0IHNldCB0byB0aGUgZXhwaXJhdGlvbiBkYXRlIChiYWNrLWNvbXBhdClcblx0ICogb3IgdGhlIG51bWJlciBvZiBzZWNvbmRzIHVudGlsIGV4cGlyYXRpb25cblx0ICovXG5cdHNldCA6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBleHBpcmVzLCBwYXRoLCBkb21haW4sIHNlY3VyZSkge1xuXHRcdHZhciBkID0gbmV3IERhdGUoKTtcblxuXHRcdGlmICggdHlwZW9mKGV4cGlyZXMpID09ICdvYmplY3QnICYmIGV4cGlyZXMudG9HTVRTdHJpbmcgKSB7XG5cdFx0XHRleHBpcmVzID0gZXhwaXJlcy50b0dNVFN0cmluZygpO1xuXHRcdH0gZWxzZSBpZiAoIHBhcnNlSW50KGV4cGlyZXMsIDEwKSApIHtcblx0XHRcdGQuc2V0VGltZSggZC5nZXRUaW1lKCkgKyAoIHBhcnNlSW50KGV4cGlyZXMsIDEwKSAqIDEwMDAgKSApOyAvLyB0aW1lIG11c3QgYmUgaW4gbWlsaXNlY29uZHNcblx0XHRcdGV4cGlyZXMgPSBkLnRvR01UU3RyaW5nKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGV4cGlyZXMgPSAnJztcblx0XHR9XG5cblx0XHRkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpICtcblx0XHRcdCgoZXhwaXJlcykgPyBcIjsgZXhwaXJlcz1cIiArIGV4cGlyZXMgOiBcIlwiKSArXG5cdFx0XHQoKHBhdGgpID8gXCI7IHBhdGg9XCIgKyBwYXRoIDogXCJcIikgK1xuXHRcdFx0KChkb21haW4pID8gXCI7IGRvbWFpbj1cIiArIGRvbWFpbiA6IFwiXCIpICtcblx0XHRcdCgoc2VjdXJlKSA/IFwiOyBzZWN1cmVcIiA6IFwiXCIpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgYSBjb29raWUuXG5cdCAqXG5cdCAqIFRoaXMgaXMgZG9uZSBieSBzZXR0aW5nIGl0IHRvIGFuIGVtcHR5IHZhbHVlIGFuZCBzZXR0aW5nIHRoZSBleHBpcmF0aW9uIHRpbWUgaW4gdGhlIHBhc3QuXG5cdCAqL1xuXHRyZW1vdmUgOiBmdW5jdGlvbihuYW1lLCBwYXRoKSB7XG5cdFx0dGhpcy5zZXQobmFtZSwgJycsIC0xMDAwLCBwYXRoKTtcblx0fVxufTtcblxuXG4vL2xvY2FsIHN0b3JhZ2VcbmFjZS5zdG9yYWdlID0ge1xuXHRnZXQ6IGZ1bmN0aW9uKGtleSkge1xuXHRcdHJldHVybiB3aW5kb3dbJ2xvY2FsU3RvcmFnZSddLmdldEl0ZW0oa2V5KTtcblx0fSxcblx0c2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0d2luZG93Wydsb2NhbFN0b3JhZ2UnXS5zZXRJdGVtKGtleSAsIHZhbHVlKTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcblx0XHR3aW5kb3dbJ2xvY2FsU3RvcmFnZSddLnJlbW92ZUl0ZW0oa2V5KTtcblx0fVxufTtcblxuXG5cblxuXG5cbi8vY291bnQgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIGluIGFuIG9iamVjdFxuLy91c2VmdWwgZm9yIGdldHRpbmcgdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBhc3NvY2lhdGl2ZSBhcnJheVxuYWNlLnNpemVvZiA9IGZ1bmN0aW9uKG9iaikge1xuXHR2YXIgc2l6ZSA9IDA7XG5cdGZvcih2YXIga2V5IGluIG9iaikgaWYob2JqLmhhc093blByb3BlcnR5KGtleSkpIHNpemUrKztcblx0cmV0dXJuIHNpemU7XG59XG5cbi8vYmVjYXVzZSBqUXVlcnkgbWF5IG5vdCBiZSBsb2FkZWQgYXQgdGhpcyBzdGFnZSwgd2UgdXNlIG91ciBvd24gdG9nZ2xlQ2xhc3NcbmFjZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSkge1xuXHRyZXR1cm4gKFwiIFwiICsgZWxlbS5jbGFzc05hbWUgKyBcIiBcIikuaW5kZXhPZihcIiBcIiArIGNsYXNzTmFtZSArIFwiIFwiKSA+IC0xO1xufVxuYWNlLmFkZENsYXNzID0gZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lKSB7XG4gaWYgKCFhY2UuaGFzQ2xhc3MoZWxlbSwgY2xhc3NOYW1lKSkge1xuXHR2YXIgY3VycmVudENsYXNzID0gZWxlbS5jbGFzc05hbWU7XG5cdGVsZW0uY2xhc3NOYW1lID0gY3VycmVudENsYXNzICsgKGN1cnJlbnRDbGFzcy5sZW5ndGg/IFwiIFwiIDogXCJcIikgKyBjbGFzc05hbWU7XG4gfVxufVxuYWNlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lKSB7YWNlLnJlcGxhY2VDbGFzcyhlbGVtLCBjbGFzc05hbWUpO31cblxuYWNlLnJlcGxhY2VDbGFzcyA9IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSwgbmV3Q2xhc3MpIHtcblx0dmFyIGNsYXNzVG9SZW1vdmUgPSBuZXcgUmVnRXhwKChcIihefFxcXFxzKVwiICsgY2xhc3NOYW1lICsgXCIoXFxcXHN8JClcIiksIFwiaVwiKTtcblx0ZWxlbS5jbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZS5yZXBsYWNlKGNsYXNzVG9SZW1vdmUsIGZ1bmN0aW9uIChtYXRjaCwgcDEsIHAyKSB7XG5cdFx0cmV0dXJuIG5ld0NsYXNzPyAocDEgKyBuZXdDbGFzcyArIHAyKSA6IFwiIFwiO1xuXHR9KS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcbn1cblxuYWNlLnRvZ2dsZUNsYXNzID0gZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lKSB7XG5cdGlmKGFjZS5oYXNDbGFzcyhlbGVtLCBjbGFzc05hbWUpKVxuXHRcdGFjZS5yZW1vdmVDbGFzcyhlbGVtLCBjbGFzc05hbWUpO1xuXHRlbHNlIGFjZS5hZGRDbGFzcyhlbGVtLCBjbGFzc05hbWUpO1xufVxuXG5cblxuXG4vL2RhdGFfc3RvcmFnZSBpbnN0YW5jZSB1c2VkIGluc2lkZSBhY2Uuc2V0dGluZ3MgZXRjXG5hY2UuZGF0YSA9IG5ldyBhY2UuZGF0YV9zdG9yYWdlKGFjZS5jb25maWcuc3RvcmFnZV9tZXRob2QpO1xuIiwiaWYoISAoJ2FjZScgaW4gd2luZG93KSApIHdpbmRvd1snYWNlJ10gPSB7fVxualF1ZXJ5KGZ1bmN0aW9uKCkge1xuXHQvL2F0IHNvbWUgcGxhY2VzIHdlIHRyeSB0byB1c2UgJ3RhcCcgZXZlbnQgaW5zdGVhZCBvZiAnY2xpY2snIGlmIGpxdWVyeSBtb2JpbGUgcGx1Z2luIGlzIGF2YWlsYWJsZVxuXHR3aW5kb3dbJ2FjZSddLmNsaWNrX2V2ZW50ID0gJC5mbi50YXAgPyBcInRhcFwiIDogXCJjbGlja1wiO1xufSk7XG5cbihmdW5jdGlvbigkICwgdW5kZWZpbmVkKSB7XG5cdHZhciBtdWx0aXBsaWJsZSA9ICdtdWx0aXBsZScgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnSU5QVVQnKTtcblx0dmFyIGhhc0ZpbGVMaXN0ID0gJ0ZpbGVMaXN0JyBpbiB3aW5kb3c7Ly9maWxlIGxpc3QgZW5hYmxlZCBpbiBtb2Rlcm4gYnJvd3NlcnNcblx0dmFyIGhhc0ZpbGVSZWFkZXIgPSAnRmlsZVJlYWRlcicgaW4gd2luZG93O1xuXG5cdHZhciBBY2VfRmlsZV9JbnB1dCA9IGZ1bmN0aW9uKGVsZW1lbnQgLCBzZXR0aW5ncykge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLnNldHRpbmdzID0gJC5leHRlbmQoe30sICQuZm4uYWNlX2ZpbGVfaW5wdXQuZGVmYXVsdHMsIHNldHRpbmdzKTtcblxuXHRcdHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuXHRcdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdHRoaXMuY2FuX3Jlc2V0ID0gdHJ1ZTtcblxuXHRcdHRoaXMuJGVsZW1lbnQub24oJ2NoYW5nZS5hY2VfaW5uZXJfY2FsbCcsIGZ1bmN0aW9uKGUgLCBhY2VfaW5uZXJfY2FsbCl7XG5cdFx0XHRpZihhY2VfaW5uZXJfY2FsbCA9PT0gdHJ1ZSkgcmV0dXJuOy8vdGhpcyBjaGFuZ2UgZXZlbnQgaXMgY2FsbGVkIGZyb20gYWJvdmUgZHJvcCBldmVudFxuXHRcdFx0cmV0dXJuIGhhbmRsZV9vbl9jaGFuZ2UuY2FsbChzZWxmKTtcblx0XHR9KTtcblx0XHRcblx0XHR0aGlzLiRlbGVtZW50LndyYXAoJzxkaXYgY2xhc3M9XCJhY2UtZmlsZS1pbnB1dFwiIC8+Jyk7XG5cdFx0XG5cdFx0dGhpcy5hcHBseV9zZXR0aW5ncygpO1xuXHR9XG5cdEFjZV9GaWxlX0lucHV0LmVycm9yID0ge1xuXHRcdCdGSUxFX0xPQURfRkFJTEVEJyA6IDEsXG5cdFx0J0lNQUdFX0xPQURfRkFJTEVEJyA6IDIsXG5cdFx0J1RIVU1CTkFJTF9GQUlMRUQnIDogM1xuXHR9O1xuXG5cblx0QWNlX0ZpbGVfSW5wdXQucHJvdG90eXBlLmFwcGx5X3NldHRpbmdzID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciByZW1vdmVfYnRuID0gISF0aGlzLnNldHRpbmdzLmljb25fcmVtb3ZlO1xuXG5cdFx0dGhpcy5tdWx0aSA9IHRoaXMuJGVsZW1lbnQuYXR0cignbXVsdGlwbGUnKSAmJiBtdWx0aXBsaWJsZTtcblx0XHR0aGlzLndlbGxfc3R5bGUgPSB0aGlzLnNldHRpbmdzLnN0eWxlID09ICd3ZWxsJztcblxuXHRcdGlmKHRoaXMud2VsbF9zdHlsZSkgdGhpcy4kZWxlbWVudC5wYXJlbnQoKS5hZGRDbGFzcygnYWNlLWZpbGUtbXVsdGlwbGUnKTtcblx0XHQgZWxzZSB0aGlzLiRlbGVtZW50LnBhcmVudCgpLnJlbW92ZUNsYXNzKCdhY2UtZmlsZS1tdWx0aXBsZScpO1xuXG5cdFx0dGhpcy4kZWxlbWVudC5wYXJlbnQoKS5maW5kKCc6bm90KGlucHV0W3R5cGU9ZmlsZV0pJykucmVtb3ZlKCk7Ly9yZW1vdmUgYWxsIGV4Y2VwdCBvdXIgaW5wdXQsIGdvb2QgZm9yIHdoZW4gY2hhbmdpbmcgc2V0dGluZ3Ncblx0XHR0aGlzLiRlbGVtZW50LmFmdGVyKCc8bGFiZWwgZGF0YS10aXRsZT1cIicrdGhpcy5zZXR0aW5ncy5idG5fY2hvb3NlKydcIj48c3BhbiBkYXRhLXRpdGxlPVwiJyt0aGlzLnNldHRpbmdzLm5vX2ZpbGUrJ1wiPicrKHRoaXMuc2V0dGluZ3Mubm9faWNvbiA/ICc8aSBjbGFzcz1cIicrdGhpcy5zZXR0aW5ncy5ub19pY29uKydcIj48L2k+JyA6ICcnKSsnPC9zcGFuPjwvbGFiZWw+JysocmVtb3ZlX2J0biA/ICc8YSBjbGFzcz1cInJlbW92ZVwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCInK3RoaXMuc2V0dGluZ3MuaWNvbl9yZW1vdmUrJ1wiPjwvaT48L2E+JyA6ICcnKSk7XG5cdFx0dGhpcy4kbGFiZWwgPSB0aGlzLiRlbGVtZW50Lm5leHQoKTtcblxuXHRcdHRoaXMuJGxhYmVsLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7Ly9maXJlZm94IG1vYmlsZSBkb2Vzbid0IGFsbG93ICd0YXAnIVxuXHRcdFx0aWYoIXRoaXMuZGlzYWJsZWQgJiYgIXNlbGYuZWxlbWVudC5kaXNhYmxlZCAmJiAhc2VsZi4kZWxlbWVudC5hdHRyKCdyZWFkb25seScpKSBcblx0XHRcdFx0c2VsZi4kZWxlbWVudC5jbGljaygpO1xuXHRcdH0pXG5cblx0XHRpZihyZW1vdmVfYnRuKSB0aGlzLiRsYWJlbC5uZXh0KCdhJykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbigpe1xuXHRcdFx0aWYoISBzZWxmLmNhbl9yZXNldCApIHJldHVybiBmYWxzZTtcblx0XHRcdFxuXHRcdFx0dmFyIHJldCA9IHRydWU7XG5cdFx0XHRpZihzZWxmLnNldHRpbmdzLmJlZm9yZV9yZW1vdmUpIHJldCA9IHNlbGYuc2V0dGluZ3MuYmVmb3JlX3JlbW92ZS5jYWxsKHNlbGYuZWxlbWVudCk7XG5cdFx0XHRpZighcmV0KSByZXR1cm4gZmFsc2U7XG5cdFx0XHRyZXR1cm4gc2VsZi5yZXNldF9pbnB1dCgpO1xuXHRcdH0pO1xuXG5cblx0XHRpZih0aGlzLnNldHRpbmdzLmRyb3BwYWJsZSAmJiBoYXNGaWxlTGlzdCkge1xuXHRcdFx0ZW5hYmxlX2Ryb3BfZnVuY3Rpb25hbGl0eS5jYWxsKHRoaXMpO1xuXHRcdH1cblx0fVxuXG5cdEFjZV9GaWxlX0lucHV0LnByb3RvdHlwZS5zaG93X2ZpbGVfbGlzdCA9IGZ1bmN0aW9uKCRmaWxlcykge1xuXHRcdHZhciBmaWxlcyA9IHR5cGVvZiAkZmlsZXMgPT09IFwidW5kZWZpbmVkXCIgPyB0aGlzLiRlbGVtZW50LmRhdGEoJ2FjZV9pbnB1dF9maWxlcycpIDogJGZpbGVzO1xuXHRcdGlmKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT0gMCkgcmV0dXJuO1xuXG5cdFx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0XHRpZih0aGlzLndlbGxfc3R5bGUpIHtcblx0XHRcdHRoaXMuJGxhYmVsLmZpbmQoJ3NwYW4nKS5yZW1vdmUoKTtcblx0XHRcdGlmKCF0aGlzLnNldHRpbmdzLmJ0bl9jaGFuZ2UpIHRoaXMuJGxhYmVsLmFkZENsYXNzKCdoaWRlLXBsYWNlaG9sZGVyJyk7XG5cdFx0fVxuXHRcdHRoaXMuJGxhYmVsLmF0dHIoJ2RhdGEtdGl0bGUnLCB0aGlzLnNldHRpbmdzLmJ0bl9jaGFuZ2UpLmFkZENsYXNzKCdzZWxlY3RlZCcpO1xuXHRcdFxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBmaWxlbmFtZSA9IHR5cGVvZiBmaWxlc1tpXSA9PT0gXCJzdHJpbmdcIiA/IGZpbGVzW2ldIDogJC50cmltKCBmaWxlc1tpXS5uYW1lICk7XG5cdFx0XHR2YXIgaW5kZXggPSBmaWxlbmFtZS5sYXN0SW5kZXhPZihcIlxcXFxcIikgKyAxO1xuXHRcdFx0aWYoaW5kZXggPT0gMClpbmRleCA9IGZpbGVuYW1lLmxhc3RJbmRleE9mKFwiL1wiKSArIDE7XG5cdFx0XHRmaWxlbmFtZSA9IGZpbGVuYW1lLnN1YnN0cihpbmRleCk7XG5cdFx0XHRcblx0XHRcdHZhciBmaWxlSWNvbiA9ICdpY29uLWZpbGUnO1xuXHRcdFx0aWYoKC9cXC4oanBlP2d8cG5nfGdpZnxzdmd8Ym1wfHRpZmY/KSQvaSkudGVzdChmaWxlbmFtZSkpIHtcblx0XHRcdFx0ZmlsZUljb24gPSAnaWNvbi1waWN0dXJlJztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoKC9cXC4obXBlP2d8Zmx2fG1vdnxhdml8c3dmfG1wNHxta3Z8d2VibXx3bXZ8M2dwKSQvaSkudGVzdChmaWxlbmFtZSkpIGZpbGVJY29uID0gJ2ljb24tZmlsbSc7XG5cdFx0XHRlbHNlIGlmKCgvXFwuKG1wM3xvZ2d8d2F2fHdtYXxhbXJ8YWFjKSQvaSkudGVzdChmaWxlbmFtZSkpIGZpbGVJY29uID0gJ2ljb24tbXVzaWMnO1xuXG5cblx0XHRcdGlmKCF0aGlzLndlbGxfc3R5bGUpIHRoaXMuJGxhYmVsLmZpbmQoJ3NwYW4nKS5hdHRyKHsnZGF0YS10aXRsZSc6ZmlsZW5hbWV9KS5maW5kKCdbY2xhc3MqPVwiaWNvbi1cIl0nKS5hdHRyKCdjbGFzcycsIGZpbGVJY29uKTtcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLiRsYWJlbC5hcHBlbmQoJzxzcGFuIGRhdGEtdGl0bGU9XCInK2ZpbGVuYW1lKydcIj48aSBjbGFzcz1cIicrZmlsZUljb24rJ1wiPjwvaT48L3NwYW4+Jyk7XG5cdFx0XHRcdHZhciB0eXBlID0gJC50cmltKGZpbGVzW2ldLnR5cGUpO1xuXHRcdFx0XHR2YXIgY2FuX3ByZXZpZXcgPSBoYXNGaWxlUmVhZGVyICYmIHRoaXMuc2V0dGluZ3MudGh1bWJuYWlsIFxuXHRcdFx0XHRcdFx0JiZcblx0XHRcdFx0XHRcdCggKHR5cGUubGVuZ3RoID4gMCAmJiB0eXBlLm1hdGNoKCdpbWFnZScpKSB8fCAodHlwZS5sZW5ndGggPT0gMCAmJiBmaWxlSWNvbiA9PSAnaWNvbi1waWN0dXJlJykgKS8vdGhlIHNlY29uZCBvbmUgaXMgZm9yIEFuZHJvaWQncyBkZWZhdWx0IGJyb3dzZXIgd2hpY2ggZ2l2ZXMgYW4gZW1wdHkgdGV4dCBmb3IgZmlsZS50eXBlXG5cdFx0XHRcdGlmKGNhbl9wcmV2aWV3KSB7XG5cdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFx0XHRcdCQud2hlbihwcmV2aWV3X2ltYWdlLmNhbGwodGhpcywgZmlsZXNbaV0pKS5mYWlsKGZ1bmN0aW9uKHJlc3VsdCl7XG5cdFx0XHRcdFx0XHQvL2NhbGxlZCBvbiBmYWlsdXJlIHRvIGxvYWQgcHJldmlld1xuXHRcdFx0XHRcdFx0aWYoc2VsZi5zZXR0aW5ncy5wcmV2aWV3X2Vycm9yKSBzZWxmLnNldHRpbmdzLnByZXZpZXdfZXJyb3IuY2FsbChzZWxmLCBmaWxlbmFtZSwgcmVzdWx0LmNvZGUpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdEFjZV9GaWxlX0lucHV0LnByb3RvdHlwZS5yZXNldF9pbnB1dCA9IGZ1bmN0aW9uKCkge1xuXHQgIHRoaXMuJGxhYmVsLmF0dHIoeydkYXRhLXRpdGxlJzp0aGlzLnNldHRpbmdzLmJ0bl9jaG9vc2UsICdjbGFzcyc6Jyd9KVxuXHRcdFx0LmZpbmQoJ3NwYW46Zmlyc3QnKS5hdHRyKHsnZGF0YS10aXRsZSc6dGhpcy5zZXR0aW5ncy5ub19maWxlICwgJ2NsYXNzJzonJ30pXG5cdFx0XHQuZmluZCgnW2NsYXNzKj1cImljb24tXCJdJykuYXR0cignY2xhc3MnLCB0aGlzLnNldHRpbmdzLm5vX2ljb24pXG5cdFx0XHQucHJldignaW1nJykucmVtb3ZlKCk7XG5cdFx0XHRpZighdGhpcy5zZXR0aW5ncy5ub19pY29uKSB0aGlzLiRsYWJlbC5maW5kKCdbY2xhc3MqPVwiaWNvbi1cIl0nKS5yZW1vdmUoKTtcblx0XHRcblx0XHR0aGlzLiRsYWJlbC5maW5kKCdzcGFuJykubm90KCc6Zmlyc3QnKS5yZW1vdmUoKTtcblx0XHRcblx0XHRpZih0aGlzLiRlbGVtZW50LmRhdGEoJ2FjZV9pbnB1dF9maWxlcycpKSB7XG5cdFx0XHR0aGlzLiRlbGVtZW50LnJlbW92ZURhdGEoJ2FjZV9pbnB1dF9maWxlcycpO1xuXHRcdFx0dGhpcy4kZWxlbWVudC5yZW1vdmVEYXRhKCdhY2VfaW5wdXRfbWV0aG9kJyk7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZXNldF9pbnB1dF9maWVsZCgpO1xuXHRcdFxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdEFjZV9GaWxlX0lucHV0LnByb3RvdHlwZS5yZXNldF9pbnB1dF9maWVsZCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDQzOTU3L2NsZWFyaW5nLWlucHV0LXR5cGUtZmlsZS11c2luZy1qcXVlcnkvMTMzNTEyMzQjMTMzNTEyMzRcblx0XHR0aGlzLiRlbGVtZW50LndyYXAoJzxmb3JtPicpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCkucmVzZXQoKTtcblx0XHR0aGlzLiRlbGVtZW50LnVud3JhcCgpO1xuXHR9XG5cdFxuXHRBY2VfRmlsZV9JbnB1dC5wcm90b3R5cGUuZW5hYmxlX3Jlc2V0ID0gZnVuY3Rpb24oY2FuX3Jlc2V0KSB7XG5cdFx0dGhpcy5jYW5fcmVzZXQgPSBjYW5fcmVzZXQ7XG5cdH1cblxuXHRBY2VfRmlsZV9JbnB1dC5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xuXHRcdHRoaXMuJGVsZW1lbnQuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcblx0fVxuXHRBY2VfRmlsZV9JbnB1dC5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdHRoaXMuJGVsZW1lbnQucmVtb3ZlQXR0cignZGlzYWJsZWQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblx0fVxuXHRcblx0QWNlX0ZpbGVfSW5wdXQucHJvdG90eXBlLmZpbGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICQodGhpcykuZGF0YSgnYWNlX2lucHV0X2ZpbGVzJykgfHwgbnVsbDtcblx0fVxuXHRBY2VfRmlsZV9JbnB1dC5wcm90b3R5cGUubWV0aG9kID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICQodGhpcykuZGF0YSgnYWNlX2lucHV0X21ldGhvZCcpIHx8ICcnO1xuXHR9XG5cdFxuXHRBY2VfRmlsZV9JbnB1dC5wcm90b3R5cGUudXBkYXRlX3NldHRpbmdzID0gZnVuY3Rpb24obmV3X3NldHRpbmdzKSB7XG5cdFx0dGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB0aGlzLnNldHRpbmdzLCBuZXdfc2V0dGluZ3MpO1xuXHRcdHRoaXMuYXBwbHlfc2V0dGluZ3MoKTtcblx0fVxuXG5cblxuXHR2YXIgZW5hYmxlX2Ryb3BfZnVuY3Rpb25hbGl0eSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgZHJvcGJveCA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1x0XHRcblx0XHQkKGRyb3Bib3gpLm9uKCdkcmFnZW50ZXInLCBmdW5jdGlvbihlKXtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSkub24oJ2RyYWdvdmVyJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pLm9uKCdkcm9wJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0XHR2YXIgZHQgPSBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyO1xuXHRcdFx0dmFyIGZpbGVzID0gZHQuZmlsZXM7XG5cdFx0XHRpZighc2VsZi5tdWx0aSAmJiBmaWxlcy5sZW5ndGggPiAxKSB7Ly9zaW5nbGUgZmlsZSB1cGxvYWQsIGJ1dCBkcmFnZ2VkIG11bHRpcGxlIGZpbGVzXG5cdFx0XHRcdHZhciB0bXBmaWxlcyA9IFtdO1xuXHRcdFx0XHR0bXBmaWxlcy5wdXNoKGZpbGVzWzBdKTtcblx0XHRcdFx0ZmlsZXMgPSB0bXBmaWxlczsvL2tlZXAgb25seSBmaXJzdCBmaWxlXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHZhciByZXQgPSB0cnVlO1xuXHRcdFx0aWYoc2VsZi5zZXR0aW5ncy5iZWZvcmVfY2hhbmdlKSByZXQgPSBzZWxmLnNldHRpbmdzLmJlZm9yZV9jaGFuZ2UuY2FsbChzZWxmLmVsZW1lbnQsIGZpbGVzLCB0cnVlKTsvL3RydWUgbWVhbnMgZmlsZXMgaGF2ZSBiZWVuIGRyb3BwZWRcblx0XHRcdGlmKCFyZXQgfHwgcmV0Lmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly91c2VyIGNhbiByZXR1cm4gYSBtb2RpZmllZCBGaWxlIEFycmF5IGFzIHJlc3VsdFxuXHRcdFx0aWYocmV0IGluc3RhbmNlb2YgQXJyYXkgfHwgKGhhc0ZpbGVMaXN0ICYmIHJldCBpbnN0YW5jZW9mIEZpbGVMaXN0KSkgZmlsZXMgPSByZXQ7XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0c2VsZi4kZWxlbWVudC5kYXRhKCdhY2VfaW5wdXRfZmlsZXMnLCBmaWxlcyk7Ly9zYXZlIGZpbGVzIGRhdGEgdG8gYmUgdXNlZCBsYXRlciBieSB1c2VyXG5cdFx0XHRzZWxmLiRlbGVtZW50LmRhdGEoJ2FjZV9pbnB1dF9tZXRob2QnLCAnZHJvcCcpO1xuXG5cblx0XHRcdHNlbGYuc2hvd19maWxlX2xpc3QoZmlsZXMpO1xuXHRcdFx0XG5cdFx0XHRcblx0XHRcdHNlbGYuJGVsZW1lbnQudHJpZ2dlckhhbmRsZXIoJ2NoYW5nZScgLCBbdHJ1ZV0pOy8vdHJ1ZSBtZWFucyBpbm5lcl9jYWxsXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblx0fVxuXHRcblx0XG5cdHZhciBoYW5kbGVfb25fY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJldCA9IHRydWU7XG5cdFx0aWYodGhpcy5zZXR0aW5ncy5iZWZvcmVfY2hhbmdlKSByZXQgPSB0aGlzLnNldHRpbmdzLmJlZm9yZV9jaGFuZ2UuY2FsbCh0aGlzLmVsZW1lbnQsIHRoaXMuZWxlbWVudC5maWxlcyB8fCBbdGhpcy5lbGVtZW50LnZhbHVlXS8qbWFrZSBpdCBhbiBhcnJheSovLCBmYWxzZSk7Ly9mYWxzZSBtZWFucyBmaWxlcyBoYXZlIGJlZW4gc2VsZWN0ZWQsIG5vdCBkcm9wcGVkXG5cdFx0aWYoIXJldCB8fCByZXQubGVuZ3RoID09IDApIHtcblx0XHRcdGlmKCF0aGlzLiRlbGVtZW50LmRhdGEoJ2FjZV9pbnB1dF9maWxlcycpKSB0aGlzLnJlc2V0X2lucHV0X2ZpZWxkKCk7Ly9pZiBub3RoaW5nIHNlbGVjdGVkIGJlZm9yZSwgcmVzZXQgYmVjYXVzZSBvZiB0aGUgbmV3bHkgdW5hY2NlcHRhYmxlIChyZXQ9ZmFsc2V8fGxlbmd0aD0wKSBzZWxlY3Rpb25cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0XG5cblx0XHQvL3VzZXIgY2FuIHJldHVybiBhIG1vZGlmaWVkIEZpbGUgQXJyYXkgYXMgcmVzdWx0XG5cdFx0dmFyIGZpbGVzID0gIWhhc0ZpbGVMaXN0ID8gbnVsbCA6Ly9mb3Igb2xkIElFLCBldGNcblx0XHRcdFx0XHQoKHJldCBpbnN0YW5jZW9mIEFycmF5IHx8IHJldCBpbnN0YW5jZW9mIEZpbGVMaXN0KSA/IHJldCA6IHRoaXMuZWxlbWVudC5maWxlcyk7XG5cdFx0dGhpcy4kZWxlbWVudC5kYXRhKCdhY2VfaW5wdXRfbWV0aG9kJywgJ3NlbGVjdCcpO1xuXG5cblx0XHRpZihmaWxlcyAmJiBmaWxlcy5sZW5ndGggPiAwKSB7Ly9odG1sNVxuXHRcdFx0dGhpcy4kZWxlbWVudC5kYXRhKCdhY2VfaW5wdXRfZmlsZXMnLCBmaWxlcyk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmFyIG5hbWUgPSAkLnRyaW0oIHRoaXMuZWxlbWVudC52YWx1ZSApO1xuXHRcdFx0aWYobmFtZSAmJiBuYW1lLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0ZmlsZXMgPSBbXVxuXHRcdFx0XHRmaWxlcy5wdXNoKG5hbWUpO1xuXHRcdFx0XHR0aGlzLiRlbGVtZW50LmRhdGEoJ2FjZV9pbnB1dF9maWxlcycsIGZpbGVzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZighZmlsZXMgfHwgZmlsZXMubGVuZ3RoID09IDApIHJldHVybiBmYWxzZTtcblx0XHR0aGlzLnNob3dfZmlsZV9saXN0KGZpbGVzKTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblxuXG5cblx0dmFyIHByZXZpZXdfaW1hZ2UgPSBmdW5jdGlvbihmaWxlKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciAkc3BhbiA9IHNlbGYuJGxhYmVsLmZpbmQoJ3NwYW46bGFzdCcpOy8vaXQgc2hvdWxkIGJlIG91dCBvZiBvbmxvYWQsIG90aGVyd2lzZSBhbGwgb25sb2FkcyBtYXkgdGFyZ2V0IHRoZSBzYW1lIHNwYW4gYmVjYXVzZSBvZiBkZWxheXNcblx0XHRcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZFxuXHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0JHNwYW4ucHJlcGVuZChcIjxpbWcgY2xhc3M9J21pZGRsZScgc3R5bGU9J2Rpc3BsYXk6bm9uZTsnIC8+XCIpO1xuXHRcdFx0dmFyIGltZyA9ICRzcGFuLmZpbmQoJ2ltZzpsYXN0JykuZ2V0KDApO1xuXG5cdFx0XHQkKGltZykub25lKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vaWYgaW1hZ2UgbG9hZGVkIHN1Y2Nlc3NmdWxseVxuXHRcdFx0XHR2YXIgc2l6ZSA9IDUwO1xuXHRcdFx0XHRpZihzZWxmLnNldHRpbmdzLnRodW1ibmFpbCA9PSAnbGFyZ2UnKSBzaXplID0gMTUwO1xuXHRcdFx0XHRlbHNlIGlmKHNlbGYuc2V0dGluZ3MudGh1bWJuYWlsID09ICdmaXQnKSBzaXplID0gJHNwYW4ud2lkdGgoKTtcblx0XHRcdFx0JHNwYW4uYWRkQ2xhc3Moc2l6ZSA+IDUwID8gJ2xhcmdlJyA6ICcnKTtcblxuXHRcdFx0XHR2YXIgdGh1bWIgPSBnZXRfdGh1bWJuYWlsKGltZywgc2l6ZSwgZmlsZS50eXBlKTtcblx0XHRcdFx0aWYodGh1bWIgPT0gbnVsbCkge1xuXHRcdFx0XHRcdC8vaWYgbWFraW5nIHRodW1ibmFpbCBmYWlsc1xuXHRcdFx0XHRcdCQodGhpcykucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHtjb2RlOkFjZV9GaWxlX0lucHV0LmVycm9yWydUSFVNQk5BSUxfRkFJTEVEJ119KTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdyA9IHRodW1iLncsIGggPSB0aHVtYi5oO1xuXHRcdFx0XHRpZihzZWxmLnNldHRpbmdzLnRodW1ibmFpbCA9PSAnc21hbGwnKSB7dz1oPXNpemU7fTtcblx0XHRcdFx0JChpbWcpLmNzcyh7J2JhY2tncm91bmQtaW1hZ2UnOid1cmwoJyt0aHVtYi5zcmMrJyknICwgd2lkdGg6dywgaGVpZ2h0Omh9KVx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0LmRhdGEoJ3RodW1iJywgdGh1bWIuc3JjKVxuXHRcdFx0XHRcdFx0LmF0dHIoe3NyYzonZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlFJbVdOZ1lHQmdBQUFBQlFBQmg2Rk8xQUFBQUFCSlJVNUVya0pnZ2c9PSd9KVxuXHRcdFx0XHRcdFx0LnNob3coKVxuXG5cdFx0XHRcdC8vLy8vLy8vLy8vLy8vLy8vLy9cblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSgpO1xuXHRcdFx0fSkub25lKCdlcnJvcicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL2ZvciBleGFtcGxlIHdoZW4gYSBmaWxlIGhhcyBpbWFnZSBleHRlbnN0aW9uLCBidXQgZm9ybWF0IGlzIHNvbWV0aGluZyBlbHNlXG5cdFx0XHRcdCRzcGFuLmZpbmQoJ2ltZycpLnJlbW92ZSgpO1xuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3Qoe2NvZGU6QWNlX0ZpbGVfSW5wdXQuZXJyb3JbJ0lNQUdFX0xPQURfRkFJTEVEJ119KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuXHRcdH1cblx0XHRyZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZWZlcnJlZC5yZWplY3Qoe2NvZGU6QWNlX0ZpbGVfSW5wdXQuZXJyb3JbJ0ZJTEVfTE9BRF9GQUlMRUQnXX0pO1xuXHRcdH1cblx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG5cdH1cblxuXHR2YXIgZ2V0X3RodW1ibmFpbCA9IGZ1bmN0aW9uKGltZywgc2l6ZSwgdHlwZSkge1xuXHRcdFxuXHRcdHZhciB3ID0gaW1nLndpZHRoLCBoID0gaW1nLmhlaWdodDtcblx0XHRpZih3ID4gc2l6ZSB8fCBoID4gc2l6ZSkge1xuXHRcdCAgaWYodyA+IGgpIHtcblx0XHRcdGggPSBwYXJzZUludChzaXplL3cgKiBoKTtcblx0XHRcdHcgPSBzaXplO1xuXHRcdCAgfSBlbHNlIHtcblx0XHRcdHcgPSBwYXJzZUludChzaXplL2ggKiB3KTtcblx0XHRcdGggPSBzaXplO1xuXHRcdCAgfVxuXHRcdH1cblxuXHRcdHZhciBkYXRhVVJMXG5cdFx0dHJ5IHtcblx0XHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdGNhbnZhcy53aWR0aCA9IHc7IGNhbnZhcy5oZWlnaHQgPSBoO1xuXHRcdFx0dmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRcdGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0LCAwLCAwLCB3LCBoKTtcblx0XHRcdGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKC8qdHlwZSA9PSAnaW1hZ2UvanBlZycgPyB0eXBlIDogJ2ltYWdlL3BuZycsIDEwKi8pXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRkYXRhVVJMID0gbnVsbDtcblx0XHR9XG5cblx0XHQvL3RoZXJlIHdhcyBvbmx5IG9uZSBpbWFnZSB0aGF0IGZhaWxlZCBpbiBmaXJlZm94IGNvbXBsZXRlbHkgcmFuZG9tbHkhIHNvIGxldCdzIGRvdWJsZSBjaGVjayBpdFxuXHRcdGlmKCEoIC9eZGF0YVxcOmltYWdlXFwvKHBuZ3xqcGU/Z3xnaWYpO2Jhc2U2NCxbMC05QS1aYS16XFwrXFwvXFw9XSskLy50ZXN0KGRhdGFVUkwpKSApIGRhdGFVUkwgPSBudWxsO1xuXHRcdGlmKCEgZGF0YVVSTCkgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4ge3NyYzogZGF0YVVSTCwgdzp3LCBoOmh9O1xuXHR9XG5cblxuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0JC5mbi5hY2VfZmlsZV9pbnB1dCA9IGZ1bmN0aW9uIChvcHRpb24sdmFsdWUpIHtcblx0XHR2YXIgcmV0dmFsO1xuXG5cdFx0dmFyICRzZXQgPSB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyICR0aGlzID0gJCh0aGlzKTtcblx0XHRcdHZhciBkYXRhID0gJHRoaXMuZGF0YSgnYWNlX2ZpbGVfaW5wdXQnKTtcblx0XHRcdHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PT0gJ29iamVjdCcgJiYgb3B0aW9uO1xuXG5cdFx0XHRpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2FjZV9maWxlX2lucHV0JywgKGRhdGEgPSBuZXcgQWNlX0ZpbGVfSW5wdXQodGhpcywgb3B0aW9ucykpKTtcblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykgcmV0dmFsID0gZGF0YVtvcHRpb25dKHZhbHVlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiAocmV0dmFsID09PSB1bmRlZmluZWQpID8gJHNldCA6IHJldHZhbDtcblx0fTtcblxuXG5cdCQuZm4uYWNlX2ZpbGVfaW5wdXQuZGVmYXVsdHMgPSB7XG5cdFx0c3R5bGU6ZmFsc2UsXG5cdFx0bm9fZmlsZTonTm8gRmlsZSAuLi4nLFxuXHRcdG5vX2ljb246J2ljb24tdXBsb2FkLWFsdCcsXG5cdFx0YnRuX2Nob29zZTonQ2hvb3NlJyxcblx0XHRidG5fY2hhbmdlOidDaGFuZ2UnLFxuXHRcdGljb25fcmVtb3ZlOidpY29uLXJlbW92ZScsXG5cdFx0ZHJvcHBhYmxlOmZhbHNlLFxuXHRcdHRodW1ibmFpbDpmYWxzZSwvL2xhcmdlLCBmaXQsIHNtYWxsXG5cdFx0XG5cdFx0Ly9jYWxsYmFja3Ncblx0XHRiZWZvcmVfY2hhbmdlOm51bGwsXG5cdFx0YmVmb3JlX3JlbW92ZTpudWxsLFxuXHRcdHByZXZpZXdfZXJyb3I6bnVsbFxuICAgICB9XG5cblxufSkod2luZG93LmpRdWVyeSk7XG5cblxuXG5cblxuXG5cblxuKGZ1bmN0aW9uKCQgLCB1bmRlZmluZWQpIHtcblx0JC5mbi5hY2Vfc3Bpbm5lciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRcblx0XHQvL3doZW4gbWluIGlzIG5lZ2F0aXZlLCB0aGUgaW5wdXQgbWF4bGVuZ3RoIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBleHRyYSBtaW51cyBzaWduXG5cdFx0dGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGljb25fdXAgPSBvcHRpb25zLmljb25fdXAgfHwgJ2ljb24tY2hldnJvbi11cCc7XG5cdFx0XHR2YXIgaWNvbl9kb3duID0gb3B0aW9ucy5pY29uX2Rvd24gfHwgJ2ljb24tY2hldnJvbi1kb3duJztcblx0XHRcdFxuXHRcdFx0dmFyIGJ0bl91cF9jbGFzcyA9IG9wdGlvbnMuYnRuX3VwX2NsYXNzIHx8ICcnO1xuXHRcdFx0dmFyIGJ0bl9kb3duX2NsYXNzID0gb3B0aW9ucy5idG5fZG93bl9jbGFzcyB8fCAnJztcblx0XHRcblx0XHRcdHZhciBtYXggPSBvcHRpb25zLm1heCB8fCA5OTk7XG5cdFx0XHRtYXggPSAoJycrbWF4KS5sZW5ndGg7XG5cdFx0XHR2YXIgJHBhcmVudF9kaXYgPSBcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnc3Bpbm5lci1pbnB1dCcpLmNzcygnd2lkdGgnICwgKG1heCoxMCkrJ3B4Jykud3JhcCgnPGRpdiBjbGFzcz1cImFjZS1zcGlubmVyXCI+Jylcblx0XHRcdFx0LmFmdGVyKCc8ZGl2IGNsYXNzPVwic3Bpbm5lci1idXR0b25zIGJ0bi1ncm91cCBidG4tZ3JvdXAtdmVydGljYWxcIj5cXFxuXHRcdFx0XHRcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gc3Bpbm5lci11cCBidG4tbWluaSAnK2J0bl91cF9jbGFzcysnXCI+XFxcblx0XHRcdFx0XHRcdDxpIGNsYXNzPVwiJytpY29uX3VwKydcIj48L2k+XFxcblx0XHRcdFx0XHRcdDwvYnV0dG9uPlxcXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBzcGlubmVyLWRvd24gYnRuLW1pbmkgJytidG5fZG93bl9jbGFzcysnXCI+XFxcblx0XHRcdFx0XHRcdDxpIGNsYXNzPVwiJytpY29uX2Rvd24rJ1wiPjwvaT5cXFxuXHRcdFx0XHRcdFx0PC9idXR0b24+XFxcblx0XHRcdFx0XHRcdDwvZGl2PicpXG5cdFx0XHRcdC5jbG9zZXN0KCcuYWNlLXNwaW5uZXInKS5zcGlubmVyKG9wdGlvbnMpLndyYXBJbm5lcihcIjxkaXYgY2xhc3M9J2lucHV0LWFwcGVuZCc+PC9kaXY+XCIpO1xuXG5cdFx0XHRcblxuXHRcdFx0JCh0aGlzKS5vbignbW91c2V3aGVlbCBET01Nb3VzZVNjcm9sbCcsIGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRcdFx0dmFyIGRlbHRhID0gZXZlbnQub3JpZ2luYWxFdmVudC5kZXRhaWwgPCAwIHx8IGV2ZW50Lm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSA+IDAgPyAxIDogLTE7XG5cdFx0XHRcdCRwYXJlbnRfZGl2LnNwaW5uZXIoJ3N0ZXAnLCBkZWx0YSA+IDApOy8vYWNjZXB0cyB0cnVlIG9yIGZhbHNlIGFzIHNlY29uZCBwYXJhbVxuXHRcdFx0XHQkcGFyZW50X2Rpdi5zcGlubmVyKCd0cmlnZ2VyQ2hhbmdlZEV2ZW50Jyk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH0pO1xuXHRcdFx0dmFyIHRoYXQgPSAkKHRoaXMpO1xuXHRcdFx0JHBhcmVudF9kaXYub24oJ2NoYW5nZWQnLCBmdW5jdGlvbigpe1xuXHRcdFx0XHR0aGF0LnRyaWdnZXIoJ2NoYW5nZScpOy8vdHJpZ2dlciB0aGUgaW5wdXQncyBjaGFuZ2UgZXZlbnRcblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0fSk7XG5cdFx0XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXG59KSh3aW5kb3cualF1ZXJ5KTtcblxuXG5cblxuXG5cbihmdW5jdGlvbigkICwgdW5kZWZpbmVkKSB7XG5cdCQuZm4uYWNlX3dpemFyZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRcblx0XHR0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpO1xuXHRcdFx0dmFyIHN0ZXBzID0gJHRoaXMuZmluZCgnbGknKTtcblx0XHRcdHZhciBudW1TdGVwcyA9IHN0ZXBzLmxlbmd0aDtcblx0XHRcdHZhciB3aWR0aCA9ICgxMDAgLyBudW1TdGVwcykrXCJcIjtcblx0XHRcdGlmKHdpZHRoLmxlbmd0aCA+IDYpICB3aWR0aCA9IHdpZHRoLnN1YnN0cigwLCA2KTtcblx0XHRcdHdpZHRoICs9ICclJztcblx0XHRcdHN0ZXBzLmNzcyh7J21pbi13aWR0aCc6d2lkdGggLCAnbWF4LXdpZHRoJzp3aWR0aH0pO1xuXHRcdFx0XG5cdFx0XHQkdGhpcy5zaG93KCkud2l6YXJkKCk7XG5cblx0XHRcdHZhciBidXR0b25zID0gJHRoaXMuc2libGluZ3MoJy53aXphcmQtYWN0aW9ucycpLmVxKDApO1xuXHRcdFx0dmFyICR3aXphcmQgPSAkdGhpcy5kYXRhKCd3aXphcmQnKTtcblx0XHRcdCR3aXphcmQuJHByZXZCdG4ucmVtb3ZlKCk7XG5cdFx0XHQkd2l6YXJkLiRuZXh0QnRuLnJlbW92ZSgpO1xuXHRcdFx0XG5cdFx0XHQkd2l6YXJkLiRwcmV2QnRuID0gYnV0dG9ucy5maW5kKCcuYnRuLXByZXYnKS5lcSgwKS5vbihhY2UuY2xpY2tfZXZlbnQsICBmdW5jdGlvbigpe1xuXHRcdFx0XHQkdGhpcy53aXphcmQoJ3ByZXZpb3VzJyk7XG5cdFx0XHR9KS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xuXHRcdFx0JHdpemFyZC4kbmV4dEJ0biA9IGJ1dHRvbnMuZmluZCgnLmJ0bi1uZXh0JykuZXEoMCkub24oYWNlLmNsaWNrX2V2ZW50LCAgZnVuY3Rpb24oKXtcblx0XHRcdFx0JHRoaXMud2l6YXJkKCduZXh0Jyk7XG5cdFx0XHR9KS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuXHRcdFx0JHdpemFyZC5uZXh0VGV4dCA9ICR3aXphcmQuJG5leHRCdG4udGV4dCgpO1xuXHRcdH0pO1xuXHRcdFxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblxufSkod2luZG93LmpRdWVyeSk7XG5cblxuXG5cblxuKGZ1bmN0aW9uKCQgLCB1bmRlZmluZWQpIHtcblx0JC5mbi5hY2VfY29sb3JwaWNrZXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0XG5cdFx0dmFyIHNldHRpbmdzID0gJC5leHRlbmQoIHtcblx0XHRcdHB1bGxfcmlnaHQ6ZmFsc2UsXG5cdFx0XHRjYXJldDp0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuXHRcdFxuXHRcdHRoaXMuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcblx0XHRcdHZhciAkdGhhdCA9ICQodGhpcyk7XG5cdFx0XHR2YXIgY29sb3JzID0gJyc7XG5cdFx0XHR2YXIgY29sb3IgPSAnJztcblx0XHRcdCQodGhpcykuaGlkZSgpLmZpbmQoJ29wdGlvbicpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciAkY2xhc3MgPSAnY29sb3JwaWNrLWJ0bic7XG5cdFx0XHRcdGlmKHRoaXMuc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHQkY2xhc3MgKz0gJyBzZWxlY3RlZCc7XG5cdFx0XHRcdFx0Y29sb3IgPSB0aGlzLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbG9ycyArPSAnPGxpPjxhIGNsYXNzPVwiJyskY2xhc3MrJ1wiIGhyZWY9XCIjXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOicrdGhpcy52YWx1ZSsnO1wiIGRhdGEtY29sb3I9XCInK3RoaXMudmFsdWUrJ1wiPjwvYT48L2xpPic7XG5cdFx0XHR9KS5lbmQoKS5vbignY2hhbmdlLmFjZV9pbm5lcl9jYWxsJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0XHQkKHRoaXMpLm5leHQoKS5maW5kKCcuYnRuLWNvbG9ycGlja2VyJykuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgdGhpcy52YWx1ZSk7XG5cdFx0XHR9KVxuXHRcdFx0LmFmdGVyKCc8ZGl2IGNsYXNzPVwiZHJvcGRvd24gZHJvcGRvd24tY29sb3JwaWNrZXJcIj48YSBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgY2xhc3M9XCJkcm9wZG93bi10b2dnbGVcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzPVwiYnRuLWNvbG9ycGlja2VyXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOicrY29sb3IrJ1wiPjwvc3Bhbj48L2E+PHVsIGNsYXNzPVwiZHJvcGRvd24tbWVudScrKHNldHRpbmdzLmNhcmV0PyAnIGRyb3Bkb3duLWNhcmV0JyA6ICcnKSsoc2V0dGluZ3MucHVsbF9yaWdodCA/ICcgcHVsbC1yaWdodCcgOiAnJykrJ1wiPicrY29sb3JzKyc8L3VsPjwvZGl2PicpXG5cdFx0XHQubmV4dCgpLmZpbmQoJy5kcm9wZG93bi1tZW51Jykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHZhciBhID0gJChlLnRhcmdldCk7XG5cdFx0XHRcdGlmKCFhLmlzKCcuY29sb3JwaWNrLWJ0bicpKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGEuY2xvc2VzdCgndWwnKS5maW5kKCcuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcblx0XHRcdFx0YS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcblx0XHRcdFx0dmFyIGNvbG9yID0gYS5kYXRhKCdjb2xvcicpO1xuXG5cdFx0XHRcdCR0aGF0LnZhbChjb2xvcikuY2hhbmdlKCk7XG5cblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTsvL2lmIGZhbHNlLCBkcm9wZG93biB3b24ndCBoaWRlIVxuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdFxuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzO1xuXHRcdFxuXHR9XHRcblx0XG5cdFxufSkod2luZG93LmpRdWVyeSk7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG4oZnVuY3Rpb24oJCAsIHVuZGVmaW5lZCkge1xuXHQkLmZuLmFjZV90cmVlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdHZhciAkb3B0aW9ucyA9IHtcblx0XHRcdCdvcGVuLWljb24nIDogJ2ljb24tZm9sZGVyLW9wZW4nLFxuXHRcdFx0J2Nsb3NlLWljb24nIDogJ2ljb24tZm9sZGVyLWNsb3NlJyxcblx0XHRcdCdzZWxlY3RhYmxlJyA6IHRydWUsXG5cdFx0XHQnc2VsZWN0ZWQtaWNvbicgOiAnaWNvbi1vaycsXG5cdFx0XHQndW5zZWxlY3RlZC1pY29uJyA6ICd0cmVlLWRvdCdcblx0XHR9XG5cdFx0XG5cdFx0JG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJG9wdGlvbnMsIG9wdGlvbnMpXG5cblx0XHR0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpO1xuXHRcdFx0JHRoaXMuaHRtbCgnPGRpdiBjbGFzcyA9IFwidHJlZS1mb2xkZXJcIiBzdHlsZT1cImRpc3BsYXk6bm9uZTtcIj5cXFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwidHJlZS1mb2xkZXItaGVhZGVyXCI+XFxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cIicrJG9wdGlvbnNbJ2Nsb3NlLWljb24nXSsnXCI+PC9pPlxcXG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cInRyZWUtZm9sZGVyLW5hbWVcIj48L2Rpdj5cXFxuXHRcdFx0XHQ8L2Rpdj5cXFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwidHJlZS1mb2xkZXItY29udGVudFwiPjwvZGl2PlxcXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ0cmVlLWxvYWRlclwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9kaXY+XFxcblx0XHRcdDwvZGl2PlxcXG5cdFx0XHQ8ZGl2IGNsYXNzPVwidHJlZS1pdGVtXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmU7XCI+XFxcblx0XHRcdFx0JysoJG9wdGlvbnNbJ3Vuc2VsZWN0ZWQtaWNvbiddID09IG51bGwgPyAnJyA6ICc8aSBjbGFzcz1cIicrJG9wdGlvbnNbJ3Vuc2VsZWN0ZWQtaWNvbiddKydcIj48L2k+JykrJ1xcXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ0cmVlLWl0ZW0tbmFtZVwiPjwvZGl2PlxcXG5cdFx0XHQ8L2Rpdj4nKTtcblx0XHRcdCR0aGlzLmFkZENsYXNzKCRvcHRpb25zWydzZWxlY3RhYmxlJ10gPT0gdHJ1ZSA/ICd0cmVlLXNlbGVjdGFibGUnIDogJ3RyZWUtdW5zZWxlY3RhYmxlJyk7XG5cdFx0XHRcblx0XHRcdCR0aGlzLnRyZWUoJG9wdGlvbnMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXG59KSh3aW5kb3cualF1ZXJ5KTtcblxuXG5cblxuXG5cblxuXG5cblxuXG5cbihmdW5jdGlvbigkICwgdW5kZWZpbmVkKSB7XG5cdCQuZm4uYWNlX3d5c2l3eWcgPSBmdW5jdGlvbigkb3B0aW9ucyAsIHVuZGVmaW5lZCkge1xuXHRcdHZhciBvcHRpb25zID0gJC5leHRlbmQoIHtcblx0XHRcdHNwZWVjaF9idXR0b246dHJ1ZSxcblx0XHRcdHd5c2l3eWc6e31cbiAgICAgICAgfSwgJG9wdGlvbnMpO1xuXG5cdFx0dmFyIGNvbG9yX3ZhbHVlcyA9IFtcblx0XHRcdCcjYWM3MjVlJywnI2QwNmI2NCcsJyNmODNhMjInLCcjZmE1NzNjJywnI2ZmNzUzNycsJyNmZmFkNDYnLFxuXHRcdFx0JyM0MmQ2OTInLCcjMTZhNzY1JywnIzdiZDE0OCcsJyNiM2RjNmMnLCcjZmJlOTgzJywnI2ZhZDE2NScsXG5cdFx0XHQnIzkyZTFjMCcsJyM5ZmUxZTcnLCcjOWZjNmU3JywnIzQ5ODZlNycsJyM5YTljZmYnLCcjYjk5YWZmJyxcblx0XHRcdCcjYzJjMmMyJywnI2NhYmRiZicsJyNjY2E2YWMnLCcjZjY5MWIyJywnI2NkNzRlNicsJyNhNDdhZTInLFxuXHRcdFx0JyM0NDQ0NDQnXG5cdFx0XVxuXG5cdFx0dmFyIGJ1dHRvbl9kZWZhdWx0cyA9XG5cdFx0e1xuXHRcdFx0J2ZvbnQnIDoge1xuXHRcdFx0XHR2YWx1ZXM6WydBcmlhbCcsICdDb3VyaWVyJywgJ0NvbWljIFNhbnMgTVMnLCAnSGVsdmV0aWNhJywgJ09wZW4gU2FucycsICdUYWhvbWEnLCAnVmVyZGFuYSddLFxuXHRcdFx0XHRpY29uOidpY29uLWZvbnQnLFxuXHRcdFx0XHR0aXRsZTonRm9udCdcblx0XHRcdH0sXG5cdFx0XHQnZm9udFNpemUnIDoge1xuXHRcdFx0XHR2YWx1ZXM6ezU6J0h1Z2UnLCAzOidOb3JtYWwnLCAxOidTbWFsbCd9LFxuXHRcdFx0XHRpY29uOidpY29uLXRleHQtaGVpZ2h0Jyxcblx0XHRcdFx0dGl0bGU6J0ZvbnQgU2l6ZSdcblx0XHRcdH0sXG5cdFx0XHQnYm9sZCcgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi1ib2xkJyxcblx0XHRcdFx0dGl0bGUgOiAnQm9sZCAoQ3RybC9DbWQrQiknXG5cdFx0XHR9LFxuXHRcdFx0J2l0YWxpYycgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi1pdGFsaWMnLFxuXHRcdFx0XHR0aXRsZSA6ICdJdGFsaWMgKEN0cmwvQ21kK0kpJ1xuXHRcdFx0fSxcblx0XHRcdCdzdHJpa2V0aHJvdWdoJyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLXN0cmlrZXRocm91Z2gnLFxuXHRcdFx0XHR0aXRsZSA6ICdTdHJpa2V0aHJvdWdoJ1xuXHRcdFx0fSxcblx0XHRcdCd1bmRlcmxpbmUnIDoge1xuXHRcdFx0XHRpY29uIDogJ2ljb24tdW5kZXJsaW5lJyxcblx0XHRcdFx0dGl0bGUgOiAnVW5kZXJsaW5lJ1xuXHRcdFx0fSxcblx0XHRcdCdpbnNlcnR1bm9yZGVyZWRsaXN0JyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLWxpc3QtdWwnLFxuXHRcdFx0XHR0aXRsZSA6ICdCdWxsZXQgbGlzdCdcblx0XHRcdH0sXG5cdFx0XHQnaW5zZXJ0b3JkZXJlZGxpc3QnIDoge1xuXHRcdFx0XHRpY29uIDogJ2ljb24tbGlzdC1vbCcsXG5cdFx0XHRcdHRpdGxlIDogJ051bWJlciBsaXN0J1xuXHRcdFx0fSxcblx0XHRcdCdvdXRkZW50JyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLWluZGVudC1sZWZ0Jyxcblx0XHRcdFx0dGl0bGUgOiAnUmVkdWNlIGluZGVudCAoU2hpZnQrVGFiKSdcblx0XHRcdH0sXG5cdFx0XHQnaW5kZW50JyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLWluZGVudC1yaWdodCcsXG5cdFx0XHRcdHRpdGxlIDogJ0luZGVudCAoVGFiKSdcblx0XHRcdH0sXG5cdFx0XHQnanVzdGlmeWxlZnQnIDoge1xuXHRcdFx0XHRpY29uIDogJ2ljb24tYWxpZ24tbGVmdCcsXG5cdFx0XHRcdHRpdGxlIDogJ0FsaWduIExlZnQgKEN0cmwvQ21kK0wpJ1xuXHRcdFx0fSxcblx0XHRcdCdqdXN0aWZ5Y2VudGVyJyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLWFsaWduLWNlbnRlcicsXG5cdFx0XHRcdHRpdGxlIDogJ0NlbnRlciAoQ3RybC9DbWQrRSknXG5cdFx0XHR9LFxuXHRcdFx0J2p1c3RpZnlyaWdodCcgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi1hbGlnbi1yaWdodCcsXG5cdFx0XHRcdHRpdGxlIDogJ0FsaWduIFJpZ2h0IChDdHJsL0NtZCtSKSdcblx0XHRcdH0sXG5cdFx0XHQnanVzdGlmeWZ1bGwnIDoge1xuXHRcdFx0XHRpY29uIDogJ2ljb24tYWxpZ24tanVzdGlmeScsXG5cdFx0XHRcdHRpdGxlIDogJ0p1c3RpZnkgKEN0cmwvQ21kK0opJ1xuXHRcdFx0fSxcblx0XHRcdCdjcmVhdGVMaW5rJyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLWxpbmsnLFxuXHRcdFx0XHR0aXRsZSA6ICdIeXBlcmxpbmsnLFxuXHRcdFx0XHRidXR0b25fdGV4dCA6ICdBZGQnLFxuXHRcdFx0XHRwbGFjZWhvbGRlciA6ICdVUkwnLFxuXHRcdFx0XHRidXR0b25fY2xhc3MgOiAnYnRuLXByaW1hcnknXG5cdFx0XHR9LFxuXHRcdFx0J3VubGluaycgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi11bmxpbmsnLFxuXHRcdFx0XHR0aXRsZSA6ICdSZW1vdmUgSHlwZXJsaW5rJ1xuXHRcdFx0fSxcblx0XHRcdCdpbnNlcnRJbWFnZScgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi1waWN0dXJlJyxcblx0XHRcdFx0dGl0bGUgOiAnSW5zZXJ0IHBpY3R1cmUnLFxuXHRcdFx0XHRidXR0b25fdGV4dCA6ICc8aSBjbGFzcz1cImljb24tZmlsZVwiPjwvaT4gQ2hvb3NlIEltYWdlICZoZWxsaXA7Jyxcblx0XHRcdFx0cGxhY2Vob2xkZXIgOiAnSW1hZ2UgVVJMJyxcblx0XHRcdFx0YnV0dG9uX2luc2VydCA6ICdJbnNlcnQnLFxuXHRcdFx0XHRidXR0b25fY2xhc3MgOiAnYnRuLXN1Y2Nlc3MnLFxuXHRcdFx0XHRidXR0b25faW5zZXJ0X2NsYXNzIDogJ2J0bi1wcmltYXJ5Jyxcblx0XHRcdFx0Y2hvb3NlX2ZpbGU6IHRydWUgLy9zaG93IHRoZSBjaG9vc2UgZmlsZSBidXR0b24/XG5cdFx0XHR9LFxuXHRcdFx0J2ZvcmVDb2xvcicgOiB7XG5cdFx0XHRcdHZhbHVlcyA6IGNvbG9yX3ZhbHVlcyxcblx0XHRcdFx0dGl0bGUgOiAnQ2hhbmdlIENvbG9yJ1xuXHRcdFx0fSxcblx0XHRcdCdiYWNrQ29sb3InIDoge1xuXHRcdFx0XHR2YWx1ZXMgOiBjb2xvcl92YWx1ZXMsXG5cdFx0XHRcdHRpdGxlIDogJ0NoYW5nZSBCYWNrZ3JvdW5kIENvbG9yJ1xuXHRcdFx0fSxcblx0XHRcdCd1bmRvJyA6IHtcblx0XHRcdFx0aWNvbiA6ICdpY29uLXVuZG8nLFxuXHRcdFx0XHR0aXRsZSA6ICdVbmRvIChDdHJsL0NtZCtaKSdcblx0XHRcdH0sXG5cdFx0XHQncmVkbycgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi1yZXBlYXQnLFxuXHRcdFx0XHR0aXRsZSA6ICdSZWRvIChDdHJsL0NtZCtZKSdcblx0XHRcdH0sXG5cdFx0XHQndmlld1NvdXJjZScgOiB7XG5cdFx0XHRcdGljb24gOiAnaWNvbi1jb2RlJyxcblx0XHRcdFx0dGl0bGUgOiAnVmlldyBTb3VyY2UnXG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdHZhciB0b29sYmFyX2J1dHRvbnMgPVxuXHRcdG9wdGlvbnMudG9vbGJhciB8fFxuXHRcdFtcblx0XHRcdCdmb250Jyxcblx0XHRcdG51bGwsXG5cdFx0XHQnZm9udFNpemUnLFxuXHRcdFx0bnVsbCxcblx0XHRcdCdib2xkJyxcblx0XHRcdCdpdGFsaWMnLFxuXHRcdFx0J3N0cmlrZXRocm91Z2gnLFxuXHRcdFx0J3VuZGVybGluZScsXG5cdFx0XHRudWxsLFxuXHRcdFx0J2luc2VydHVub3JkZXJlZGxpc3QnLFxuXHRcdFx0J2luc2VydG9yZGVyZWRsaXN0Jyxcblx0XHRcdCdvdXRkZW50Jyxcblx0XHRcdCdpbmRlbnQnLFxuXHRcdFx0bnVsbCxcblx0XHRcdCdqdXN0aWZ5bGVmdCcsXG5cdFx0XHQnanVzdGlmeWNlbnRlcicsXG5cdFx0XHQnanVzdGlmeXJpZ2h0Jyxcblx0XHRcdCdqdXN0aWZ5ZnVsbCcsXG5cdFx0XHRudWxsLFxuXHRcdFx0J2NyZWF0ZUxpbmsnLFxuXHRcdFx0J3VubGluaycsXG5cdFx0XHRudWxsLFxuXHRcdFx0J2luc2VydEltYWdlJyxcblx0XHRcdG51bGwsXG5cdFx0XHQnZm9yZUNvbG9yJyxcblx0XHRcdG51bGwsXG5cdFx0XHQndW5kbycsXG5cdFx0XHQncmVkbycsXG5cdFx0XHRudWxsLFxuXHRcdFx0J3ZpZXdTb3VyY2UnXG5cdFx0XVxuXG5cblx0XHR0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdG9vbGJhciA9ICcgPGRpdiBjbGFzcz1cInd5c2l3eWctdG9vbGJhciBidG4tdG9vbGJhciBjZW50ZXJcIj4gPGRpdiBjbGFzcz1cImJ0bi1ncm91cFwiPiAnO1xuXG5cdFx0XHRmb3IodmFyIHRiIGluIHRvb2xiYXJfYnV0dG9ucykgaWYodG9vbGJhcl9idXR0b25zLmhhc093blByb3BlcnR5KHRiKSkge1xuXHRcdFx0XHR2YXIgYnV0dG9uID0gdG9vbGJhcl9idXR0b25zW3RiXTtcblx0XHRcdFx0aWYoYnV0dG9uID09PSBudWxsKXtcblx0XHRcdFx0XHR0b29sYmFyICs9ICcgPC9kaXY+IDxkaXYgY2xhc3M9XCJidG4tZ3JvdXBcIj4gJztcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYodHlwZW9mIGJ1dHRvbiA9PSBcInN0cmluZ1wiICYmIGJ1dHRvbiBpbiBidXR0b25fZGVmYXVsdHMpIHtcblx0XHRcdFx0XHRidXR0b24gPSBidXR0b25fZGVmYXVsdHNbYnV0dG9uXTtcblx0XHRcdFx0XHRidXR0b24ubmFtZSA9IHRvb2xiYXJfYnV0dG9uc1t0Yl07XG5cdFx0XHRcdH0gZWxzZSBpZih0eXBlb2YgYnV0dG9uID09IFwib2JqZWN0XCIgJiYgYnV0dG9uLm5hbWUgaW4gYnV0dG9uX2RlZmF1bHRzKSB7XG5cdFx0XHRcdFx0YnV0dG9uID0gJC5leHRlbmQoYnV0dG9uX2RlZmF1bHRzW2J1dHRvbi5uYW1lXSAsIGJ1dHRvbik7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBjb250aW51ZTtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBjbGFzc05hbWUgPSBcImNsYXNzTmFtZVwiIGluIGJ1dHRvbiA/IGJ1dHRvbi5jbGFzc05hbWUgOiAnJztcblx0XHRcdFx0c3dpdGNoKGJ1dHRvbi5uYW1lKSB7XG5cdFx0XHRcdFx0Y2FzZSAnZm9udCc6XG5cdFx0XHRcdFx0XHR0b29sYmFyICs9ICcgPGEgY2xhc3M9XCJidG4gYnRuLXNtYWxsICcrY2xhc3NOYW1lKycgZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIHRpdGxlPVwiJytidXR0b24udGl0bGUrJ1wiPjxpIGNsYXNzPVwiJytidXR0b24uaWNvbisnXCI+PC9pPjxpIGNsYXNzPVwiaWNvbi1hbmdsZS1kb3duIGljb24tb24tcmlnaHRcIj48L2k+PC9hPiAnO1xuXHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDx1bCBjbGFzcz1cImRyb3Bkb3duLW1lbnUgZHJvcGRvd24tbGlnaHRcIj4nO1xuXHRcdFx0XHRcdFx0Zm9yKHZhciBmb250IGluIGJ1dHRvbi52YWx1ZXMpXG5cdFx0XHRcdFx0XHRcdGlmKGJ1dHRvbi52YWx1ZXMuaGFzT3duUHJvcGVydHkoZm9udCkpXG5cdFx0XHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDxsaT48YSBkYXRhLWVkaXQ9XCJmb250TmFtZSAnICsgYnV0dG9uLnZhbHVlc1tmb250XSArJ1wiIHN0eWxlPVwiZm9udC1mYW1pbHk6XFwnJysgYnV0dG9uLnZhbHVlc1tmb250XSAgKydcXCdcIj4nK2J1dHRvbi52YWx1ZXNbZm9udF0gICsgJzwvYT48L2xpPiAnXG5cdFx0XHRcdFx0XHR0b29sYmFyICs9ICcgPC91bD4nO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSAnZm9udFNpemUnOlxuXHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDxhIGNsYXNzPVwiYnRuIGJ0bi1zbWFsbCAnK2NsYXNzTmFtZSsnIGRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiB0aXRsZT1cIicrYnV0dG9uLnRpdGxlKydcIj48aSBjbGFzcz1cIicrYnV0dG9uLmljb24rJ1wiPjwvaT4mbmJzcDs8aSBjbGFzcz1cImljb24tYW5nbGUtZG93biBpY29uLW9uLXJpZ2h0XCI+PC9pPjwvYT4gJztcblx0XHRcdFx0XHRcdHRvb2xiYXIgKz0gJyA8dWwgY2xhc3M9XCJkcm9wZG93bi1tZW51IGRyb3Bkb3duLWxpZ2h0XCI+ICc7XG5cdFx0XHRcdFx0XHRmb3IodmFyIHNpemUgaW4gYnV0dG9uLnZhbHVlcylcblx0XHRcdFx0XHRcdFx0aWYoYnV0dG9uLnZhbHVlcy5oYXNPd25Qcm9wZXJ0eShzaXplKSlcblx0XHRcdFx0XHRcdFx0XHR0b29sYmFyICs9ICcgPGxpPjxhIGRhdGEtZWRpdD1cImZvbnRTaXplICcrc2l6ZSsnXCI+PGZvbnQgc2l6ZT1cIicrc2l6ZSsnXCI+JysgYnV0dG9uLnZhbHVlc1tzaXplXSArJzwvZm9udD48L2E+PC9saT4gJ1xuXHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDwvdWw+ICc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlICdjcmVhdGVMaW5rJzpcblx0XHRcdFx0XHRcdHRvb2xiYXIgKz0gJyA8ZGl2IGNsYXNzPVwiaW5saW5lIHBvc2l0aW9uLXJlbGF0aXZlXCI+IDxhIGNsYXNzPVwiYnRuIGJ0bi1zbWFsbCAnK2NsYXNzTmFtZSsnIGRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiB0aXRsZT1cIicrYnV0dG9uLnRpdGxlKydcIj48aSBjbGFzcz1cIicrYnV0dG9uLmljb24rJ1wiPjwvaT48L2E+ICc7XG5cdFx0XHRcdFx0XHR0b29sYmFyICs9ICcgPGRpdiBjbGFzcz1cImRyb3Bkb3duLW1lbnUgZHJvcGRvd24tY2FyZXQgcHVsbC1yaWdodFwiPlxcXG5cdFx0XHRcdFx0XHRcdDxpbnB1dCBwbGFjZWhvbGRlcj1cIicrYnV0dG9uLnBsYWNlaG9sZGVyKydcIiB0eXBlPVwidGV4dFwiIGRhdGEtZWRpdD1cIicrYnV0dG9uLm5hbWUrJ1wiIC8+XFxcblx0XHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc21hbGwgJytidXR0b24uYnV0dG9uX2NsYXNzKydcIiB0eXBlPVwiYnV0dG9uXCI+JytidXR0b24uYnV0dG9uX3RleHQrJzwvYnV0dG9uPlxcXG5cdFx0XHRcdFx0XHQ8L2Rpdj4gPC9kaXY+Jztcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgJ2luc2VydEltYWdlJzpcblx0XHRcdFx0XHRcdHRvb2xiYXIgKz0gJyA8ZGl2IGNsYXNzPVwiaW5saW5lIHBvc2l0aW9uLXJlbGF0aXZlXCI+IDxhIGNsYXNzPVwiYnRuIGJ0bi1zbWFsbCAnK2NsYXNzTmFtZSsnIGRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiB0aXRsZT1cIicrYnV0dG9uLnRpdGxlKydcIj48aSBjbGFzcz1cIicrYnV0dG9uLmljb24rJ1wiPjwvaT48L2E+ICc7XG5cdFx0XHRcdFx0XHR0b29sYmFyICs9ICcgPGRpdiBjbGFzcz1cImRyb3Bkb3duLW1lbnUgZHJvcGRvd24tY2FyZXQgcHVsbC1yaWdodFwiPlxcXG5cdFx0XHRcdFx0XHRcdDxpbnB1dCBwbGFjZWhvbGRlcj1cIicrYnV0dG9uLnBsYWNlaG9sZGVyKydcIiB0eXBlPVwidGV4dFwiIGRhdGEtZWRpdD1cIicrYnV0dG9uLm5hbWUrJ1wiIC8+XFxcblx0XHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc21hbGwgJytidXR0b24uYnV0dG9uX2luc2VydF9jbGFzcysnXCIgdHlwZT1cImJ1dHRvblwiPicrYnV0dG9uLmJ1dHRvbl9pbnNlcnQrJzwvYnV0dG9uPiAnO1xuXHRcdFx0XHRcdFx0XHRpZiggYnV0dG9uLmNob29zZV9maWxlICYmICdGaWxlUmVhZGVyJyBpbiB3aW5kb3cgKSB0b29sYmFyICs9XG5cdFx0XHRcdFx0XHRcdCAnPGRpdiBjbGFzcz1cImNlbnRlclwiPlxcXG5cdFx0XHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc21hbGwgJytidXR0b24uYnV0dG9uX2NsYXNzKycgd3lzaXd5Zy1jaG9vc2UtZmlsZVwiIHR5cGU9XCJidXR0b25cIj4nK2J1dHRvbi5idXR0b25fdGV4dCsnPC9idXR0b24+XFxcblx0XHRcdFx0XHRcdFx0XHQ8aW5wdXQgdHlwZT1cImZpbGVcIiBkYXRhLWVkaXQ9XCInK2J1dHRvbi5uYW1lKydcIiAvPlxcXG5cdFx0XHRcdFx0XHRcdCAgPC9kaXY+J1xuXHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDwvZGl2PiA8L2Rpdj4nO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSAnZm9yZUNvbG9yJzpcblx0XHRcdFx0XHRjYXNlICdiYWNrQ29sb3InOlxuXHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDxzZWxlY3QgY2xhc3M9XCJoaWRlIHd5c2l3eWdfY29sb3JwaWNrZXJcIiB0aXRsZT1cIicrYnV0dG9uLnRpdGxlKydcIj4gJztcblx0XHRcdFx0XHRcdGZvcih2YXIgY29sb3IgaW4gYnV0dG9uLnZhbHVlcylcblx0XHRcdFx0XHRcdFx0dG9vbGJhciArPSAnIDxvcHRpb24gdmFsdWU9XCInK2J1dHRvbi52YWx1ZXNbY29sb3JdKydcIj4nK2J1dHRvbi52YWx1ZXNbY29sb3JdKyc8L29wdGlvbj4gJztcblx0XHRcdFx0XHRcdHRvb2xiYXIgKz0gJyA8L3NlbGVjdD4gJztcblx0XHRcdFx0XHRcdHRvb2xiYXIgKz0gJyA8aW5wdXQgc3R5bGU9XCJkaXNwbGF5Om5vbmU7XCIgZGlzYWJsZWQgY2xhc3M9XCJoaWRlXCIgdHlwZT1cInRleHRcIiBkYXRhLWVkaXQ9XCInK2J1dHRvbi5uYW1lKydcIiAvPiAnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSAndmlld1NvdXJjZSc6XG5cdFx0XHRcdFx0XHR0b29sYmFyICs9ICcgPGEgY2xhc3M9XCJidG4gYnRuLXNtYWxsICcrY2xhc3NOYW1lKydcIiBkYXRhLXZpZXc9XCJzb3VyY2VcIiB0aXRsZT1cIicrYnV0dG9uLnRpdGxlKydcIj48aSBjbGFzcz1cIicrYnV0dG9uLmljb24rJ1wiPjwvaT48L2E+ICc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdHRvb2xiYXIgKz0gJyA8YSBjbGFzcz1cImJ0biBidG4tc21hbGwgJytjbGFzc05hbWUrJ1wiIGRhdGEtZWRpdD1cIicrYnV0dG9uLm5hbWUrJ1wiIHRpdGxlPVwiJytidXR0b24udGl0bGUrJ1wiPjxpIGNsYXNzPVwiJytidXR0b24uaWNvbisnXCI+PC9pPjwvYT4gJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dG9vbGJhciArPSAnIDwvZGl2PiA8L2Rpdj4gJztcblxuXG5cblx0XHRcdC8vaWYgd2UgaGF2ZSBhIGZ1bmN0aW9uIHRvIGRlY2lkZSB3aGVyZSB0byBwdXQgdGhlIHRvb2xiYXIsIHRoZW4gY2FsbCB0aGF0XG5cdFx0XHRpZihvcHRpb25zLnRvb2xiYXJfcGxhY2UpIHRvb2xiYXIgPSBvcHRpb25zLnRvb2xiYXJfcGxhY2UuY2FsbCh0aGlzLCB0b29sYmFyKTtcblx0XHRcdC8vb3RoZXJ3aXNlIHB1dCBpdCBqdXN0IGJlZm9yZSBvdXIgRElWXG5cdFx0XHRlbHNlIHRvb2xiYXIgPSAkKHRoaXMpLmJlZm9yZSh0b29sYmFyKS5wcmV2KCk7XG5cblx0XHRcdHRvb2xiYXIuZmluZCgnYVt0aXRsZV0nKS50b29sdGlwKHthbmltYXRpb246ZmFsc2V9KTtcblx0XHRcdHRvb2xiYXIuZmluZCgnLmRyb3Bkb3duLW1lbnUgaW5wdXQ6bm90KFt0eXBlPWZpbGVdKScpLm9uKGFjZS5jbGlja19ldmVudCwgZnVuY3Rpb24oKSB7cmV0dXJuIGZhbHNlfSlcblx0XHQgICAgLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHskKHRoaXMpLmNsb3Nlc3QoJy5kcm9wZG93bi1tZW51Jykuc2libGluZ3MoJy5kcm9wZG93bi10b2dnbGUnKS5kcm9wZG93bigndG9nZ2xlJyl9KVxuXHRcdFx0Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtpZihlLndoaWNoID09IDI3KSB7dGhpcy52YWx1ZT0nJzskKHRoaXMpLmNoYW5nZSgpfX0pO1xuXHRcdFx0dG9vbGJhci5maW5kKCdpbnB1dFt0eXBlPWZpbGVdJykucHJldigpLm9uKGFjZS5jbGlja19ldmVudCwgZnVuY3Rpb24gKGUpIHsgXG5cdFx0XHRcdCQodGhpcykubmV4dCgpLmNsaWNrKCk7XG5cdFx0XHR9KTtcblx0XHRcdHRvb2xiYXIuZmluZCgnLnd5c2l3eWdfY29sb3JwaWNrZXInKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKHRoaXMpLmFjZV9jb2xvcnBpY2tlcih7cHVsbF9yaWdodDp0cnVlfSkuY2hhbmdlKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0JCh0aGlzKS5uZXh0QWxsKCdpbnB1dCcpLmVxKDApLnZhbCh0aGlzLnZhbHVlKS5jaGFuZ2UoKTtcblx0XHRcdFx0fSkubmV4dCgpLmZpbmQoJy5idG4tY29sb3JwaWNrZXInKS50b29sdGlwKHt0aXRsZTogdGhpcy50aXRsZSwgYW5pbWF0aW9uOmZhbHNlfSlcblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHR2YXIgc3BlZWNoX2lucHV0O1xuXHRcdFx0aWYgKG9wdGlvbnMuc3BlZWNoX2J1dHRvbiAmJiAnb253ZWJraXRzcGVlY2hjaGFuZ2UnIGluIChzcGVlY2hfaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpKSkge1xuXHRcdFx0XHR2YXIgZWRpdG9yT2Zmc2V0ID0gJCh0aGlzKS5vZmZzZXQoKTtcblx0XHRcdFx0dG9vbGJhci5hcHBlbmQoc3BlZWNoX2lucHV0KTtcblx0XHRcdFx0JChzcGVlY2hfaW5wdXQpLmF0dHIoe3R5cGU6J3RleHQnLCAnZGF0YS1lZGl0JzonaW5zZXJ0dGV4dCcsJ3gtd2Via2l0LXNwZWVjaCc6Jyd9KS5hZGRDbGFzcygnd3lzaXd5Zy1zcGVlY2gtaW5wdXQnKVxuXHRcdFx0XHQuY3NzKHsncG9zaXRpb24nOidhYnNvbHV0ZSd9KS5vZmZzZXQoe3RvcDogZWRpdG9yT2Zmc2V0LnRvcCwgbGVmdDogZWRpdG9yT2Zmc2V0LmxlZnQrJCh0aGlzKS5pbm5lcldpZHRoKCktMzV9KTtcblx0XHRcdH0gZWxzZSBzcGVlY2hfaW5wdXQgPSBudWxsXG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0Ly92aWV3IHNvdXJjZVxuXHRcdFx0dmFyIHNlbGYgPSAkKHRoaXMpO1xuXHRcdFx0dmFyIHZpZXdfc291cmNlID0gZmFsc2U7XG5cdFx0XHR0b29sYmFyLmZpbmQoJ2FbZGF0YS12aWV3PXNvdXJjZV0nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYoIXZpZXdfc291cmNlKSB7XG5cdFx0XHRcdFx0JCgnPHRleHRhcmVhIC8+Jylcblx0XHRcdFx0XHQuY3NzKHsnd2lkdGgnOnNlbGYud2lkdGgoKS0zLCAnaGVpZ2h0JzpzZWxmLmhlaWdodCgpLTF9KVxuXHRcdFx0XHRcdC52YWwoc2VsZi5odG1sKCkpXG5cdFx0XHRcdFx0Lmluc2VydEFmdGVyKHNlbGYpXG5cdFx0XHRcdFx0c2VsZi5oaWRlKCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnYWN0aXZlJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0dmFyIHRleHRhcmVhID0gc2VsZi5uZXh0KCk7XG5cdFx0XHRcdFx0c2VsZi5odG1sKHRleHRhcmVhLnZhbCgpKS5zaG93KCk7XG5cdFx0XHRcdFx0dGV4dGFyZWEucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0JCh0aGlzKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHZpZXdfc291cmNlID0gIXZpZXdfc291cmNlO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dmFyICRvcHRpb25zID0gJC5leHRlbmQoe30sIHsgYWN0aXZlVG9vbGJhckNsYXNzOiAnYWN0aXZlJyAsIHRvb2xiYXJTZWxlY3RvciA6IHRvb2xiYXIgfSwgb3B0aW9ucy53eXNpd3lnIHx8IHt9KVxuXHRcdFx0JCh0aGlzKS53eXNpd3lnKCAkb3B0aW9ucyApO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXG59KSh3aW5kb3cualF1ZXJ5KTsiLCJpZighICgnYWNlJyBpbiB3aW5kb3cpICkgd2luZG93WydhY2UnXSA9IHt9XG5qUXVlcnkoZnVuY3Rpb24oJCkge1xuXHQvL2F0IHNvbWUgcGxhY2VzIHdlIHRyeSB0byB1c2UgJ3RhcCcgZXZlbnQgaW5zdGVhZCBvZiAnY2xpY2snIGlmIGpxdWVyeSBtb2JpbGUgcGx1Z2luIGlzIGF2YWlsYWJsZVxuXHR3aW5kb3dbJ2FjZSddLmNsaWNrX2V2ZW50ID0gJC5mbi50YXAgPyBcInRhcFwiIDogXCJjbGlja1wiO1xufSk7XG5cbmpRdWVyeShmdW5jdGlvbigkKSB7XG5cdC8vYWNlLmNsaWNrX2V2ZW50IGRlZmluZWQgaW4gYWNlLWVsZW1lbnRzLmpzXG5cdGFjZS5oYW5kbGVfc2lkZV9tZW51KGpRdWVyeSk7XG5cblx0Ly9hY2UuZW5hYmxlX3NlYXJjaF9haGVhZChqUXVlcnkpO1xuXG5cdGFjZS5nZW5lcmFsX3RoaW5ncyhqUXVlcnkpOy8vYW5kIHNldHRpbmdzXG5cblx0YWNlLndpZGdldF9ib3hlcyhqUXVlcnkpO1xuXG5cdC8qKlxuXHQvL21ha2Ugc2lkZWJhciBzY3JvbGxiYXIgd2hlbiBpdCBpcyBmaXhlZCBhbmQgc29tZSBwYXJ0cyBvZiBpdCBpcyBvdXQgb2Ygdmlld1xuXHQvLz4+IHlvdSBzaG91bGQgaW5jbHVkZSBqcXVlcnktdWkgYW5kIHNsaW1zY3JvbGwgamF2YXNjcmlwdCBmaWxlcyBpbiB5b3VyIGZpbGVcblx0Ly8+PiB5b3UgY2FuIGNhbGwgdGhpcyBmdW5jdGlvbiB3aGVuIHNpZGViYXIgaXMgY2xpY2tlZCB0byBiZSBmaXhlZFxuXHQkKCcubmF2LWxpc3QnKS5zbGltU2Nyb2xsKHtcblx0XHRoZWlnaHQ6ICc0MDBweCcsXG5cdFx0ZGlzdGFuY2U6MCxcblx0XHRzaXplIDogJzZweCdcblx0fSk7XG5cdCovXG59KTtcblxuXG5cbmFjZS5oYW5kbGVfc2lkZV9tZW51ID0gZnVuY3Rpb24oJCkge1xuXHQkKCcjbWVudS10b2dnbGVyJykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbigpIHtcblx0XHQkKCcjc2lkZWJhcicpLnRvZ2dsZUNsYXNzKCdkaXNwbGF5Jyk7XG5cdFx0JCh0aGlzKS50b2dnbGVDbGFzcygnZGlzcGxheScpO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fSk7XG5cdC8vbWluaVxuXHR2YXIgJG1pbmltaXplZCA9ICQoJyNzaWRlYmFyJykuaGFzQ2xhc3MoJ21lbnUtbWluJyk7XG5cdCQoJyNzaWRlYmFyLWNvbGxhcHNlJykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbigpe1xuXHRcdCRtaW5pbWl6ZWQgPSAkKCcjc2lkZWJhcicpLmhhc0NsYXNzKCdtZW51LW1pbicpO1xuXHRcdGFjZS5zZXR0aW5ncy5zaWRlYmFyX2NvbGxhcHNlZCghJG1pbmltaXplZCk7Ly9AIGFjZS1leHRyYS5qc1xuXHR9KTtcblxuXHR2YXIgdG91Y2ggPSBcIm9udG91Y2hlbmRcIiBpbiBkb2N1bWVudDtcblx0Ly9vcGVuaW5nIHN1Ym1lbnVcblx0JCgnLm5hdi1saXN0Jykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbihlKXtcblx0XHQvL2NoZWNrIHRvIHNlZSBpZiB3ZSBoYXZlIGNsaWNrZWQgb24gYW4gZWxlbWVudCB3aGljaCBpcyBpbnNpZGUgYSAuZHJvcGRvd24tdG9nZ2xlIGVsZW1lbnQ/IVxuXHRcdC8vaWYgc28sIGl0IG1lYW5zIHdlIHNob3VsZCB0b2dnbGUgYSBzdWJtZW51XG5cdFx0dmFyIGxpbmtfZWxlbWVudCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ2EnKTtcblx0XHRpZighbGlua19lbGVtZW50IHx8IGxpbmtfZWxlbWVudC5sZW5ndGggPT0gMCkgcmV0dXJuOy8vaWYgbm90IGNsaWNrZWQgaW5zaWRlIGEgbGluayBlbGVtZW50XG5cdFx0XG5cdFx0JG1pbmltaXplZCA9ICQoJyNzaWRlYmFyJykuaGFzQ2xhc3MoJ21lbnUtbWluJyk7XG5cdFx0XG5cdFx0aWYoISBsaW5rX2VsZW1lbnQuaGFzQ2xhc3MoJ2Ryb3Bkb3duLXRvZ2dsZScpICkgey8vaXQgZG9lc24ndCBoYXZlIGEgc3VibWVudSByZXR1cm5cblx0XHRcdC8vanVzdCBvbmUgdGhpbmcgYmVmb3JlIHdlIHJldHVyblxuXHRcdFx0Ly9pZiBzaWRlYmFyIGlzIGNvbGxhcHNlZChtaW5pbWl6ZWQpIGFuZCB3ZSBjbGljayBvbiBhIGZpcnN0IGxldmVsIG1lbnUgaXRlbVxuXHRcdFx0Ly9hbmQgdGhlIGNsaWNrIGlzIG9uIHRoZSBpY29uLCBub3Qgb24gdGhlIG1lbnUgdGV4dCB0aGVuIGxldCdzIGNhbmNlbCBldmVudCBhbmQgY2FuY2VsIG5hdmlnYXRpb25cblx0XHRcdC8vR29vZCBmb3IgdG91Y2ggZGV2aWNlcywgdGhhdCB3aGVuIHRoZSBpY29uIGlzIHRhcHBlZCB0byBzZWUgdGhlIG1lbnUgdGV4dCwgbmF2aWdhdGlvbiBpcyBjYW5jZWxsZWRcblx0XHRcdC8vbmF2aWdhdGlvbiBpcyBvbmx5IGRvbmUgd2hlbiBtZW51IHRleHQgaXMgdGFwcGVkXG5cdFx0XHRpZigkbWluaW1pemVkICYmIGFjZS5jbGlja19ldmVudCA9PSBcInRhcFwiICYmXG5cdFx0XHRcdGxpbmtfZWxlbWVudC5nZXQoMCkucGFyZW50Tm9kZS5wYXJlbnROb2RlID09IHRoaXMgLyoubmF2LWxpc3QqLyApLy9pLmUuIG9ubHkgbGV2ZWwtMSBsaW5rc1xuXHRcdFx0e1xuXHRcdFx0XHRcdHZhciB0ZXh0ID0gbGlua19lbGVtZW50LmZpbmQoJy5tZW51LXRleHQnKS5nZXQoMCk7XG5cdFx0XHRcdFx0aWYoIGUudGFyZ2V0ICE9IHRleHQgJiYgISQuY29udGFpbnModGV4dCAsIGUudGFyZ2V0KSApLy9ub3QgY2xpY2tpbmcgb24gdGhlIHRleHQgb3IgaXRzIGNoaWxkcmVuXG5cdFx0XHRcdFx0ICByZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly9cblx0XHR2YXIgc3ViID0gbGlua19lbGVtZW50Lm5leHQoKS5nZXQoMCk7XG5cblx0XHQvL2lmIHdlIGFyZSBvcGVuaW5nIHRoaXMgc3VibWVudSwgY2xvc2UgYWxsIG90aGVyIHN1Ym1lbnVzIGV4Y2VwdCB0aGUgXCIuYWN0aXZlXCIgb25lXG5cdFx0aWYoISAkKHN1YikuaXMoJzp2aXNpYmxlJykgKSB7Ly9pZiBub3Qgb3BlbiBhbmQgdmlzaWJsZSwgbGV0J3Mgb3BlbiBpdCBhbmQgbWFrZSBpdCB2aXNpYmxlXG5cdFx0ICB2YXIgcGFyZW50X3VsID0gJChzdWIucGFyZW50Tm9kZSkuY2xvc2VzdCgndWwnKTtcblx0XHQgIGlmKCRtaW5pbWl6ZWQgJiYgcGFyZW50X3VsLmhhc0NsYXNzKCduYXYtbGlzdCcpKSByZXR1cm47XG5cdFx0ICBcblx0XHQgIHBhcmVudF91bC5maW5kKCc+IC5vcGVuID4gLnN1Ym1lbnUnKS5lYWNoKGZ1bmN0aW9uKCl7XG5cdFx0XHQvL2Nsb3NlIGFsbCBvdGhlciBvcGVuIHN1Ym1lbnVzIGV4Y2VwdCBmb3IgdGhlIGFjdGl2ZSBvbmVcblx0XHRcdGlmKHRoaXMgIT0gc3ViICYmICEkKHRoaXMucGFyZW50Tm9kZSkuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG5cdFx0XHRcdCQodGhpcykuc2xpZGVVcCgyMDApLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvL3VuY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmUgdG8gY2xvc2UgYWxsIHN1Ym1lbnVzIG9uIGRlZXBlciBsZXZlbHMgd2hlbiBjbG9zaW5nIGEgc3VibWVudVxuXHRcdFx0XHQvLyQodGhpcykuZmluZCgnLm9wZW4gPiAuc3VibWVudScpLnNsaWRlVXAoMCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ29wZW4nKTtcblx0XHRcdH1cblx0XHQgIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvL3VuY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmUgdG8gY2xvc2UgYWxsIHN1Ym1lbnVzIG9uIGRlZXBlciBsZXZlbHMgd2hlbiBjbG9zaW5nIGEgc3VibWVudVxuXHRcdFx0Ly8kKHN1YikuZmluZCgnLm9wZW4gPiAuc3VibWVudScpLnNsaWRlVXAoMCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ29wZW4nKTtcblx0XHR9XG5cblx0XHRpZigkbWluaW1pemVkICYmICQoc3ViLnBhcmVudE5vZGUucGFyZW50Tm9kZSkuaGFzQ2xhc3MoJ25hdi1saXN0JykpIHJldHVybiBmYWxzZTtcblxuXHRcdCQoc3ViKS5zbGlkZVRvZ2dsZSgyMDApLnBhcmVudCgpLnRvZ2dsZUNsYXNzKCdvcGVuJyk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgfSlcbn1cblxuXG5cbmFjZS5nZW5lcmFsX3RoaW5ncyA9IGZ1bmN0aW9uKCQpIHtcbiAkKCcuYWNlLW5hdiBbY2xhc3MqPVwiaWNvbi1hbmltYXRlZC1cIl0nKS5jbG9zZXN0KCdhJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcblx0dmFyIGljb24gPSAkKHRoaXMpLmZpbmQoJ1tjbGFzcyo9XCJpY29uLWFuaW1hdGVkLVwiXScpLmVxKDApO1xuXHR2YXIgJG1hdGNoID0gaWNvbi5hdHRyKCdjbGFzcycpLm1hdGNoKC9pY29uXFwtYW5pbWF0ZWRcXC0oW1xcZFxcd10rKS8pO1xuXHRpY29uLnJlbW92ZUNsYXNzKCRtYXRjaFswXSk7XG5cdCQodGhpcykub2ZmKCdjbGljaycpO1xuIH0pO1xuIFxuIC8vJCgnLm5hdi1saXN0IC5iYWRnZVt0aXRsZV0sLm5hdi1saXN0IC5sYWJlbFt0aXRsZV0nKS50b29sdGlwKHsncGxhY2VtZW50JzoncmlnaHQnfSk7XG5cblxuXG4gLy9zaW1wbGUgc2V0dGluZ3NcblxuICQoJyNhY2Utc2V0dGluZ3MtYnRuJykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbigpe1xuXHQkKHRoaXMpLnRvZ2dsZUNsYXNzKCdvcGVuJyk7XG5cdCQoJyNhY2Utc2V0dGluZ3MtYm94JykudG9nZ2xlQ2xhc3MoJ29wZW4nKTtcbiB9KTtcblxuXG4vKiAkKCcjYWNlLXNldHRpbmdzLW5hdmJhcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG5cdGFjZS5zZXR0aW5ncy5uYXZiYXJfZml4ZWQodGhpcy5jaGVja2VkKTsvL0AgYWNlLWV4dHJhLmpzXG4gfSkuZ2V0KDApLmNoZWNrZWQgPSBhY2Uuc2V0dGluZ3MuaXMoJ25hdmJhcicsICdmaXhlZCcpXG5cbiAkKCcjYWNlLXNldHRpbmdzLXNpZGViYXInKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuXHRhY2Uuc2V0dGluZ3Muc2lkZWJhcl9maXhlZCh0aGlzLmNoZWNrZWQpOy8vQCBhY2UtZXh0cmEuanNcbiB9KS5nZXQoMCkuY2hlY2tlZCA9IGFjZS5zZXR0aW5ncy5pcygnc2lkZWJhcicsICdmaXhlZCcpXG4gXG4gJCgnI2FjZS1zZXR0aW5ncy1icmVhZGNydW1icycpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG5cdGFjZS5zZXR0aW5ncy5icmVhZGNydW1ic19maXhlZCh0aGlzLmNoZWNrZWQpOy8vQCBhY2UtZXh0cmEuanNcbiB9KS5nZXQoMCkuY2hlY2tlZCA9IGFjZS5zZXR0aW5ncy5pcygnYnJlYWRjcnVtYnMnLCAnZml4ZWQnKVxuXG5cbiAvL1N3aXRjaGluZyB0byBSVEwgKHJpZ2h0IHRvIGxlZnQpIE1vZGVcbiAkKCcjYWNlLXNldHRpbmdzLXJ0bCcpLnJlbW92ZUF0dHIoJ2NoZWNrZWQnKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuXHRhY2Uuc3dpdGNoX2RpcmVjdGlvbihqUXVlcnkpO1xuIH0pOyovXG5cblxuICQoJyNidG4tc2Nyb2xsLXVwJykub24oYWNlLmNsaWNrX2V2ZW50LCBmdW5jdGlvbigpe1xuXHR2YXIgZHVyYXRpb24gPSBNYXRoLm1heCgxMDAsIHBhcnNlSW50KCQoJ2h0bWwnKS5zY3JvbGxUb3AoKSAvIDMpKTtcblx0JCgnaHRtbCxib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiAwfSwgZHVyYXRpb24pO1xuXHRyZXR1cm4gZmFsc2U7XG4gfSk7XG4gXG4gIHRyeSB7XG5cdCQoJyNza2luLWNvbG9ycGlja2VyJykuYWNlX2NvbG9ycGlja2VyKCk7XG4gIH0gY2F0Y2goZSkge31cblxuICAkKCcjc2tpbi1jb2xvcnBpY2tlcicpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpe1xuXHR2YXIgc2tpbl9jbGFzcyA9ICQodGhpcykuZmluZCgnb3B0aW9uOnNlbGVjdGVkJykuZGF0YSgnc2tpbicpO1xuXG5cdHZhciBib2R5ID0gJChkb2N1bWVudC5ib2R5KTtcblx0Ym9keS5yZW1vdmVDbGFzcygnc2tpbi0xIHNraW4tMiBza2luLTMnKTtcblxuXG5cdGlmKHNraW5fY2xhc3MgIT0gJ2RlZmF1bHQnKSBib2R5LmFkZENsYXNzKHNraW5fY2xhc3MpO1xuXG5cdGlmKHNraW5fY2xhc3MgPT0gJ3NraW4tMScpIHtcblx0XHQkKCcuYWNlLW5hdiA+IGxpLmdyZXknKS5hZGRDbGFzcygnZGFyaycpO1xuXHR9XG5cdGVsc2Uge1xuXHRcdCQoJy5hY2UtbmF2ID4gbGkuZ3JleScpLnJlbW92ZUNsYXNzKCdkYXJrJyk7XG5cdH1cblxuXHRpZihza2luX2NsYXNzID09ICdza2luLTInKSB7XG5cdFx0JCgnLmFjZS1uYXYgPiBsaScpLmFkZENsYXNzKCduby1ib3JkZXIgbWFyZ2luLTEnKTtcblx0XHQkKCcuYWNlLW5hdiA+IGxpOm5vdCg6bGFzdC1jaGlsZCknKS5hZGRDbGFzcygnbGlnaHQtcGluaycpLmZpbmQoJz4gYSA+IFtjbGFzcyo9XCJpY29uLVwiXScpLmFkZENsYXNzKCdwaW5rJykuZW5kKCkuZXEoMCkuZmluZCgnLmJhZGdlJykuYWRkQ2xhc3MoJ2JhZGdlLXdhcm5pbmcnKTtcblx0fVxuXHRlbHNlIHtcblx0XHQkKCcuYWNlLW5hdiA+IGxpJykucmVtb3ZlQ2xhc3MoJ25vLWJvcmRlciBtYXJnaW4tMScpO1xuXHRcdCQoJy5hY2UtbmF2ID4gbGk6bm90KDpsYXN0LWNoaWxkKScpLnJlbW92ZUNsYXNzKCdsaWdodC1waW5rJykuZmluZCgnPiBhID4gW2NsYXNzKj1cImljb24tXCJdJykucmVtb3ZlQ2xhc3MoJ3BpbmsnKS5lbmQoKS5lcSgwKS5maW5kKCcuYmFkZ2UnKS5yZW1vdmVDbGFzcygnYmFkZ2Utd2FybmluZycpO1xuXHR9XG5cblx0aWYoc2tpbl9jbGFzcyA9PSAnc2tpbi0zJykge1xuXHRcdCQoJy5hY2UtbmF2ID4gbGkuZ3JleScpLmFkZENsYXNzKCdyZWQnKS5maW5kKCcuYmFkZ2UnKS5hZGRDbGFzcygnYmFkZ2UteWVsbG93Jyk7XG5cdH0gZWxzZSB7XG5cdFx0JCgnLmFjZS1uYXYgPiBsaS5ncmV5JykucmVtb3ZlQ2xhc3MoJ3JlZCcpLmZpbmQoJy5iYWRnZScpLnJlbW92ZUNsYXNzKCdiYWRnZS15ZWxsb3cnKTtcblx0fVxuIH0pO1xuIFxufVxuXG5cblxuYWNlLndpZGdldF9ib3hlcyA9IGZ1bmN0aW9uKCQpIHtcblx0JCgnLnBhZ2UtY29udGVudCwjcGFnZS1jb250ZW50JykuZGVsZWdhdGUoJy53aWRnZXQtdG9vbGJhciA+IFtkYXRhLWFjdGlvbl0nICwgJ2NsaWNrJywgZnVuY3Rpb24oZXYpIHtcblx0XHRldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dmFyICR0aGlzID0gJCh0aGlzKTtcblx0XHR2YXIgJGFjdGlvbiA9ICR0aGlzLmRhdGEoJ2FjdGlvbicpO1xuXHRcdHZhciAkYm94ID0gJHRoaXMuY2xvc2VzdCgnLndpZGdldC1ib3gnKTtcblxuXHRcdGlmKCRib3guaGFzQ2xhc3MoJ3VpLXNvcnRhYmxlLWhlbHBlcicpKSByZXR1cm47XG5cblx0XHRpZigkYWN0aW9uID09ICdjb2xsYXBzZScpIHtcblx0XHRcdHZhciAkYm9keSA9ICRib3guZmluZCgnLndpZGdldC1ib2R5Jyk7XG5cdFx0XHR2YXIgJGljb24gPSAkdGhpcy5maW5kKCdbY2xhc3MqPWljb24tXScpLmVxKDApO1xuXHRcdFx0dmFyICRtYXRjaCA9ICRpY29uLmF0dHIoJ2NsYXNzJykubWF0Y2goL2ljb25cXC0oLiopXFwtKHVwfGRvd24pLyk7XG5cdFx0XHR2YXIgJGljb25fZG93biA9ICdpY29uLScrJG1hdGNoWzFdKyctZG93bic7XG5cdFx0XHR2YXIgJGljb25fdXAgPSAnaWNvbi0nKyRtYXRjaFsxXSsnLXVwJztcblx0XHRcdFxuXHRcdFx0dmFyICRib2R5X2lubmVyID0gJGJvZHkuZmluZCgnLndpZGdldC1ib2R5LWlubmVyJylcblx0XHRcdGlmKCRib2R5X2lubmVyLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdCRib2R5ID0gJGJvZHkud3JhcElubmVyKCc8ZGl2IGNsYXNzPVwid2lkZ2V0LWJvZHktaW5uZXJcIj48L2Rpdj4nKS5maW5kKCc6Zmlyc3QtY2hpbGQnKS5lcSgwKTtcblx0XHRcdH0gZWxzZSAkYm9keSA9ICRib2R5X2lubmVyLmVxKDApO1xuXG5cblx0XHRcdHZhciBleHBhbmRTcGVlZCAgID0gMzAwO1xuXHRcdFx0dmFyIGNvbGxhcHNlU3BlZWQgPSAyMDA7XG5cblx0XHRcdGlmKCRib3guaGFzQ2xhc3MoJ2NvbGxhcHNlZCcpKSB7XG5cdFx0XHRcdGlmKCRpY29uKSAkaWNvbi5hZGRDbGFzcygkaWNvbl91cCkucmVtb3ZlQ2xhc3MoJGljb25fZG93bik7XG5cdFx0XHRcdCRib3gucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlZCcpO1xuXHRcdFx0XHQkYm9keS5zbGlkZVVwKDAgLCBmdW5jdGlvbigpeyRib2R5LnNsaWRlRG93bihleHBhbmRTcGVlZCl9KTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRpZigkaWNvbikgJGljb24uYWRkQ2xhc3MoJGljb25fZG93bikucmVtb3ZlQ2xhc3MoJGljb25fdXApO1xuXHRcdFx0XHQkYm9keS5zbGlkZVVwKGNvbGxhcHNlU3BlZWQsIGZ1bmN0aW9uKCl7JGJveC5hZGRDbGFzcygnY29sbGFwc2VkJyl9KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSBpZigkYWN0aW9uID09ICdjbG9zZScpIHtcblx0XHRcdHZhciBjbG9zZVNwZWVkID0gcGFyc2VJbnQoJHRoaXMuZGF0YSgnY2xvc2Utc3BlZWQnKSkgfHwgMzAwO1xuXHRcdFx0JGJveC5oaWRlKGNsb3NlU3BlZWQgLCBmdW5jdGlvbigpeyRib3gucmVtb3ZlKCl9KTtcblx0XHR9XG5cdFx0ZWxzZSBpZigkYWN0aW9uID09ICdyZWxvYWQnKSB7XG5cdFx0XHQkdGhpcy5ibHVyKCk7XG5cblx0XHRcdHZhciAkcmVtb3ZlID0gZmFsc2U7XG5cdFx0XHRpZigkYm94LmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykgeyRyZW1vdmUgPSB0cnVlOyAkYm94LmFkZENsYXNzKCdwb3NpdGlvbi1yZWxhdGl2ZScpO31cblx0XHRcdCRib3guYXBwZW5kKCc8ZGl2IGNsYXNzPVwid2lkZ2V0LWJveC1sYXllclwiPjxpIGNsYXNzPVwiaWNvbi1zcGlubmVyIGljb24tc3BpbiBpY29uLTJ4IHdoaXRlXCI+PC9pPjwvZGl2PicpO1xuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHQkYm94LmZpbmQoJy53aWRnZXQtYm94LWxheWVyJykucmVtb3ZlKCk7XG5cdFx0XHRcdGlmKCRyZW1vdmUpICRib3gucmVtb3ZlQ2xhc3MoJ3Bvc2l0aW9uLXJlbGF0aXZlJyk7XG5cdFx0XHR9LCBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMTAwMCArIDEwMDApKTtcblx0XHR9XG5cdFx0ZWxzZSBpZigkYWN0aW9uID09ICdzZXR0aW5ncycpIHtcblxuXHRcdH1cblxuXHR9KTtcbn1cblxuXG5cbi8qLy9zZWFyY2ggYm94J3MgZHJvcGRvd24gYXV0b2NvbXBsZXRlXG5hY2UuZW5hYmxlX3NlYXJjaF9haGVhZCA9IGZ1bmN0aW9uKCQpIHtcblx0YWNlLnZhcmlhYmxlX1VTX1NUQVRFUyA9IFtcIkFsYWJhbWFcIixcIkFsYXNrYVwiLFwiQXJpem9uYVwiLFwiQXJrYW5zYXNcIixcIkNhbGlmb3JuaWFcIixcIkNvbG9yYWRvXCIsXCJDb25uZWN0aWN1dFwiLFwiRGVsYXdhcmVcIixcIkZsb3JpZGFcIixcIkdlb3JnaWFcIixcIkhhd2FpaVwiLFwiSWRhaG9cIixcIklsbGlub2lzXCIsXCJJbmRpYW5hXCIsXCJJb3dhXCIsXCJLYW5zYXNcIixcIktlbnR1Y2t5XCIsXCJMb3Vpc2lhbmFcIixcIk1haW5lXCIsXCJNYXJ5bGFuZFwiLFwiTWFzc2FjaHVzZXR0c1wiLFwiTWljaGlnYW5cIixcIk1pbm5lc290YVwiLFwiTWlzc2lzc2lwcGlcIixcIk1pc3NvdXJpXCIsXCJNb250YW5hXCIsXCJOZWJyYXNrYVwiLFwiTmV2YWRhXCIsXCJOZXcgSGFtcHNoaXJlXCIsXCJOZXcgSmVyc2V5XCIsXCJOZXcgTWV4aWNvXCIsXCJOZXcgWW9ya1wiLFwiTm9ydGggRGFrb3RhXCIsXCJOb3J0aCBDYXJvbGluYVwiLFwiT2hpb1wiLFwiT2tsYWhvbWFcIixcIk9yZWdvblwiLFwiUGVubnN5bHZhbmlhXCIsXCJSaG9kZSBJc2xhbmRcIixcIlNvdXRoIENhcm9saW5hXCIsXCJTb3V0aCBEYWtvdGFcIixcIlRlbm5lc3NlZVwiLFwiVGV4YXNcIixcIlV0YWhcIixcIlZlcm1vbnRcIixcIlZpcmdpbmlhXCIsXCJXYXNoaW5ndG9uXCIsXCJXZXN0IFZpcmdpbmlhXCIsXCJXaXNjb25zaW5cIixcIld5b21pbmdcIl0sXG5cdCQoJyNuYXYtc2VhcmNoLWlucHV0JykudHlwZWFoZWFkKHtcblx0XHRzb3VyY2U6IGFjZS52YXJpYWJsZV9VU19TVEFURVMsXG5cdFx0dXBkYXRlcjpmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0JCgnI25hdi1zZWFyY2gtaW5wdXQnKS5mb2N1cygpO1xuXHRcdFx0cmV0dXJuIGl0ZW07XG5cdFx0fVxuXHR9KTtcbn0qL1xuXG5cblxuYWNlLnN3aXRjaF9kaXJlY3Rpb24gPSBmdW5jdGlvbigkKSB7XG5cdHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSk7XG5cdCRib2R5XG5cdC50b2dnbGVDbGFzcygncnRsJylcblx0Ly90b2dnbGUgcHVsbC1yaWdodCBjbGFzcyBvbiBkcm9wZG93bi1tZW51XG5cdC5maW5kKCcuZHJvcGRvd24tbWVudTpub3QoLmRhdGVwaWNrZXItZHJvcGRvd24sLmNvbG9ycGlja2VyKScpLnRvZ2dsZUNsYXNzKCdwdWxsLXJpZ2h0Jylcblx0LmVuZCgpXG5cdC8vc3dhcCBwdWxsLWxlZnQgJiBwdWxsLXJpZ2h0XG5cdC5maW5kKCcucHVsbC1yaWdodDpub3QoLmRyb3Bkb3duLW1lbnUsYmxvY2txdW90ZSwuZHJvcGRvd24tc3VibWVudSwucHJvZmlsZS1za2lsbHMgLnB1bGwtcmlnaHQsLmNvbnRyb2wtZ3JvdXAgLmNvbnRyb2xzID4gW2NsYXNzKj1cInNwYW5cIl06Zmlyc3QtY2hpbGQpJykucmVtb3ZlQ2xhc3MoJ3B1bGwtcmlnaHQnKS5hZGRDbGFzcygndG1wLXJ0bC1wdWxsLXJpZ2h0Jylcblx0LmVuZCgpXG5cdC5maW5kKCcucHVsbC1sZWZ0Om5vdCguZHJvcGRvd24tc3VibWVudSwucHJvZmlsZS1za2lsbHMgLnB1bGwtbGVmdCknKS5yZW1vdmVDbGFzcygncHVsbC1sZWZ0JykuYWRkQ2xhc3MoJ3B1bGwtcmlnaHQnKVxuXHQuZW5kKClcblx0LmZpbmQoJy50bXAtcnRsLXB1bGwtcmlnaHQnKS5yZW1vdmVDbGFzcygndG1wLXJ0bC1wdWxsLXJpZ2h0JykuYWRkQ2xhc3MoJ3B1bGwtbGVmdCcpXG5cdC5lbmQoKVxuXHRcblx0LmZpbmQoJy5jaG9zZW4tY29udGFpbmVyJykudG9nZ2xlQ2xhc3MoJ2Nob3Nlbi1ydGwnKVxuXHQuZW5kKClcblxuXHQuZmluZCgnLmNvbnRyb2wtZ3JvdXAgLmNvbnRyb2xzID4gW2NsYXNzKj1cInNwYW5cIl06Zmlyc3QtY2hpbGQnKS50b2dnbGVDbGFzcygncHVsbC1yaWdodCcpXG5cdC5lbmQoKVxuXHRcblx0ZnVuY3Rpb24gc3dhcF9jbGFzc2VzKGNsYXNzMSwgY2xhc3MyKSB7XG5cdFx0JGJvZHlcblx0XHQgLmZpbmQoJy4nK2NsYXNzMSkucmVtb3ZlQ2xhc3MoY2xhc3MxKS5hZGRDbGFzcygndG1wLXJ0bC0nK2NsYXNzMSlcblx0XHQgLmVuZCgpXG5cdFx0IC5maW5kKCcuJytjbGFzczIpLnJlbW92ZUNsYXNzKGNsYXNzMikuYWRkQ2xhc3MoY2xhc3MxKVxuXHRcdCAuZW5kKClcblx0XHQgLmZpbmQoJy50bXAtcnRsLScrY2xhc3MxKS5yZW1vdmVDbGFzcygndG1wLXJ0bC0nK2NsYXNzMSkuYWRkQ2xhc3MoY2xhc3MyKVxuXHR9XG5cdGZ1bmN0aW9uIHN3YXBfc3R5bGVzKHN0eWxlMSwgc3R5bGUyLCBlbGVtZW50cykge1xuXHRcdGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKXtcblx0XHRcdHZhciBlID0gJCh0aGlzKTtcblx0XHRcdHZhciB0bXAgPSBlLmNzcyhzdHlsZTIpO1xuXHRcdFx0ZS5jc3Moc3R5bGUyICwgZS5jc3Moc3R5bGUxKSk7XG5cdFx0XHRlLmNzcyhzdHlsZTEgLCB0bXApO1xuXHRcdH0pO1xuXHR9XG5cblx0c3dhcF9jbGFzc2VzKCdhbGlnbi1sZWZ0JywgJ2FsaWduLXJpZ2h0Jyk7XG5cdHN3YXBfY2xhc3NlcygnYXJyb3dlZCcsICdhcnJvd2VkLXJpZ2h0Jyk7XG5cdHN3YXBfY2xhc3NlcygnYXJyb3dlZC1pbicsICdhcnJvd2VkLWluLXJpZ2h0Jyk7XG5cdHN3YXBfY2xhc3NlcygnbWVzc2FnZWJhci1pdGVtLWxlZnQnLCAnbWVzc2FnZWJhci1pdGVtLXJpZ2h0Jyk7Ly9mb3IgaW5ib3ggcGFnZVxuXG5cblx0Ly9yZWRyYXcgdGhlIHRyYWZmaWMgcGllIGNoYXJ0IG9uIGhvbWVwYWdlIHdpdGggYSBkaWZmZXJlbnQgcGFyYW1ldGVyXG5cdHZhciBwbGFjZWhvbGRlciA9ICQoJyNwaWVjaGFydC1wbGFjZWhvbGRlcicpO1xuXHRpZihwbGFjZWhvbGRlci5zaXplKCkgPiAwKSB7XG5cdFx0dmFyIHBvcyA9ICQoZG9jdW1lbnQuYm9keSkuaGFzQ2xhc3MoJ3J0bCcpID8gJ253JyA6ICduZSc7Ly9kcmF3IG9uIG5vcnRoLXdlc3Qgb3Igbm9ydGgtZWFzdD9cblx0XHRwbGFjZWhvbGRlci5kYXRhKCdkcmF3JykuY2FsbChwbGFjZWhvbGRlci5nZXQoMCkgLCBwbGFjZWhvbGRlciwgcGxhY2Vob2xkZXIuZGF0YSgnY2hhcnQnKSwgcG9zKTtcblx0fVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9