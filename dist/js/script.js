Engine.Plugins.profile = {
	element:{
		tabs:{
			settings:{
				tab:{},
				tabHeaders:{},
				tabContents:{},
			},
			main:{
				tab:{},
				tabHeaders:{},
				tabContents:{},
			},
		},
	},
	init:function(){
		var checkExist = setInterval(function(){
			if(Engine.Contents.Auth != undefined){
				clearInterval(checkExist);
				if(Engine.Helper.isSet(Engine.Contents,['Auth','Options','application','ProfileWidgetLocation'])){
					switch(Engine.Contents.Auth.Options.application.ProfileWidgetLocation.value){
						case"Sidebar":
							Engine.Plugins.profile.Widget.Sidebar();
							break;
						case"Navbar":
							Engine.Plugins.profile.Widget.Navbar();
							break;
					}
				} else { Engine.Plugins.profile.Widget.Sidebar(); }
			}
		}, 100);
	},
	load:{
		index:function(){
			var checkExist = setInterval(function(){
				if(Engine.Helper.isSet(Engine.Contents,['Auth','User'])){
					clearInterval(checkExist);
					var aboutCTN = $('#profileAbout');
					var detailsCTN = $('#profileDetails');
					Engine.GUI.insert(Engine.Contents.Auth.User);
					for(var [key, value] of Object.entries(Engine.Contents.Auth.User)){
						if(!['id','password','picture','username','initials','office','token','api_token','reset_token','last_login','name'].includes(key)){
							if(value == null){ value = ''; }
							if(Engine.Auth.validate('custom', 'profile_'+key, 3)){
								Engine.Builder.input(aboutCTN.find('div'), key, value, function(input){
									switch(input.attr('data-key')){
										case'first_name':
										case'middle_name':
										case'last_name':input.wrap('<div class="col-md-4 py-2"></div>');break;
										case'phone':
										case'mobile':input.wrap('<div class="col-md-6 py-2"></div>');break;
										case'organization':aboutCTN.find('[data-key="job_title"]').first().parent().before(input);input.wrap('<div class="col-md-12 py-2"></div>');break;
										default:input.wrap('<div class="col-md-12 py-2"></div>');break;
									}
								});
							} else {
								if(Engine.Auth.validate('custom', 'profile_'+key, 1)){
									switch(key){
										case'first_name':
										case'middle_name':
										case'last_name':break;
										default:detailsCTN.find('ul').append('<li class="list-group-item"><b><i class="icon icon-'+key+' mr-1"></i>'+Engine.Contents.Language[Engine.Helper.ucfirst(Engine.Helper.clean(key))]+'</b><a class="float-right">'+value+'</a></li>');break;
									}
								}
							}
						}
					}
					aboutCTN.append('<div class="row"><div class="col-md-12"><button type="button" class="btn btn-block btn-success"><i class="fas fa-save mr-1"></i>'+Engine.Contents.Language['Save']+'</button></div></div>');
					aboutCTN.find('button').off().click(function(){
						// Init User Data
						var userData = {};
						var skipKey = ['password','type','location','picture','username','initials','office','token','api_token','reset_token','last_login','name'];
						for(var [key, value] of Object.entries(Engine.Contents.Auth.User)){
							if(!skipKey.includes(key)){
								userData[key] = value;
							}
						}
						// Fetch User Data
						aboutCTN.find('input[data-key]').each(function(){
							if(!skipKey.includes($(this).attr('data-key'))){ userData[$(this).attr('data-key')] = $(this).val(); }
						});
						aboutCTN.find('select[data-key]').each(function(){
							if(!skipKey.includes($(this).attr('data-key'))){ userData[$(this).attr('data-key')] = $(this).select2('val'); }
						});
						userData.initials = '';
						if((userData.first_name != '')&&(userData.first_name != null)){ userData.initials += userData.first_name.charAt(0)+'.'; }
						if((userData.middle_name != '')&&(userData.middle_name != null)){ userData.initials += userData.middle_name.charAt(0)+'.'; }
						if((userData.last_name != '')&&(userData.last_name != null)){ userData.initials += userData.last_name.charAt(0)+'.'; }
						aboutCTN.find('textarea').each(function(){
							if(!skipKey.includes($(this).attr('data-key'))){
								if(!$(this).summernote('isEmpty')){
									userData[$(this).attr('data-key')] = $(this).summernote('code');
								}
								$(this).summernote('destroy');
								$(this).summernote({
									toolbar: [
										['font', ['fontname', 'fontsize']],
										['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
										['color', ['color']],
										['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
									],
									height: 250,
								});
							}
						});
						// Saving User Data
						Engine.request('users','update',{ data:userData },function(result){
							var data = JSON.parse(result);
							if(data.success != undefined){
								Engine.Contents.Auth.User.name = '';
								for(var [key, value] of Object.entries(data.output.dom)){
									if(!skipKey.includes(key)){ Engine.Contents.Auth.User[key] = value; }
									if(((key == 'first_name')||(key == 'middle_name')||(key == 'last_name'))&&(value != '')&&(value != null)){
										if(Engine.Contents.Auth.User.name != ''){ Engine.Contents.Auth.User.name += ' '; }
										Engine.Contents.Auth.User.name += value;
									}
								}
								Engine.GUI.insert(Engine.Contents.Auth.User);
							}
						});
					});
				}
			}, 100);
			// Get User Data
			Engine.request('users','get',{data:{id:Engine.Contents.Auth.User.id}},function(result){
				var data = JSON.parse(result);
				if(data.success != undefined){
					Engine.Plugins.profile.Tabs.init();
					// Application Settings
					Engine.Plugins.profile.Settings.Tabs.add('Application',function(tab,header){});
					// Customization Settings
					Engine.Plugins.profile.Settings.Tabs.add('Customization',function(tab,header){
						var lists = {
							swalPosition:['top','top-start','top-end','center','center-start','center-end','bottom','bottom-start','bottom-end'],
							ProfileWidgetLocation:['Navbar','Sidebar'],
							landingPage:[],
							callWidgetLocation:['topLeft','topLeft','bottomRight','bottomLeft'],
							callStatus:['calls','issues'],
						};
						for(var [plugin, status] of Object.entries(Engine.Contents.Plugins)){ lists.landingPage.push(plugin); }
						var count = 0, printcount = 0;
						for(var [key, value] of Object.entries(Engine.Contents.Settings.customization)){
							if(!['pace','logobg','nav','navmode','sidenav','sidenavmode'].includes(key)){
								++count;
								if(Engine.Helper.isSet(Engine.Contents.Auth.Options,['application',key,'value'])){ value.value = Engine.Contents.Auth.Options.application[key].value; }
								Engine.Builder.input(tab,key,value.value,{type:value.type,list:lists,icon:'fas fa-cog'},function(input){
									var valkey = input.find('[data-key][name]').attr('data-key'), val = '';
									input.wrap('<div class="col-12 pb-2"></div>');
									if(Engine.Contents.Settings.customization[valkey].type == "switch"){
										var checkLoaded = setInterval(function(){
											if(input.find('input[data-key]').is(":visible")){
												clearInterval(checkLoaded);
												if(Engine.Helper.isSet(Engine.Contents.Settings,['customization',valkey,'value'])){ val = Engine.Contents.Settings.customization[valkey].value; }
												if(Engine.Helper.isSet(Engine.Contents.Auth.Options,['application',valkey,'value'])){ val = Engine.Contents.Auth.Options.application[valkey].value; }
												input.find('input[data-key]').bootstrapSwitch('state',val);
											}
										}, 100);
									}
									++printcount;
								});
							}
						}
						var checkLoaded = setInterval(function(){
							if(count == printcount){
								clearInterval(checkLoaded);
								tab.append('<div class="col-12"><button type="button" class="btn btn-success btn-block"><i class="fas fa-save mr-1"></i>'+Engine.Contents.Language['Save']+'</button></div>')
								tab.find('button').off().click(function(){
									var settings = [];
									tab.find('[data-key]').each(function(){
										if(!$(this).is('div')){
											var key = $(this).attr('data-key'), value = '';
											switch(Engine.Contents.Settings.customization[key].type){
												case"select": value = $(this).select2('val');break;
												case"switch": value = $(this).bootstrapSwitch('state');break;
												default: value = $(this).val();break;
											}
											settings.push({
												name:key,
												type:'application',
												value:value,
												user:Engine.Contents.Auth.User.id,
												record:Engine.Contents.Settings.customization[key].type,
											});
										}
									});
									// Submit
									Engine.request('options','update',{data:{records:settings}},function(result){
										var data = JSON.parse(result);
										if(typeof data.success !== 'undefined'){
											console.log(data);
											for(var [key, parameter] of Object.entries(data.output.dom)){
												Engine.Helper.set(Engine.Contents.Settings,['customization',parameter.name,'value'],parameter.value);
											}
											if(Engine.Contents.Settings.customization.darkmode.value){ $('body').removeClass('dark-mode');$('body').addClass('dark-mode'); } else { $('body').removeClass('dark-mode'); }
										}
									});
								});
							}
						}, 100);
					});
					// Notifications
					Engine.Plugins.profile.Settings.Tabs.add('Notifications',function(tab,header){
						tab.html('<div class="table-responsive"><table class="table dt-responsive table-hover table-bordered" style="width:100%"><thead class="thead-dark"></thead></table></div>');
						var table = tab.find('table');
						var cols = [];
						cols.push({ name: "select", title: "", data: "select", width: "25px", defaultContent: '', targets: 0, orderable: false, className: 'select-checkbox'});
						cols.push({ name: "Category", title: "Category", data: "category", defaultContent: '', targets: 1 });
						cols.push({ name: "Sub Category", title: "Sub Category", data: "sub_category", defaultContent: '', targets: 2 });
						table.DataTable({
							data: data.output.subscriptions,
							searching: true,
							paging: true,
							pageLength: 10,
							lengthChange: true,
							lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
							ordering: true,
							info: true,
							autoWidth: true,
							processing: true,
							scrolling: false,
							buttons: [],
							language: {
								buttons: {
									selectAll: Engine.Contents.Language["All"],
									selectNone: Engine.Contents.Language["None"],
								},
								info: ", Total _TOTAL_ entries",
							},
							dom: '<"dtbl-toolbar"Bf>rt<"dtbl-btoolbar"lip>',
							columnDefs: cols,
							select: {
								style: 'multi',
								selector: 'td:first-child'
							},
							order: [[ 1, "asc" ]]
						});
						if(Engine.Auth.validate('button', 'selectNone', 1)){
							ctrlTxt = '<i class="icon icon-none mr-1"></i>'+Engine.Contents.Language['None'];
							table.DataTable().button().add(0,{ text: ctrlTxt, extend: 'selectNone' });
						}
						if(Engine.Auth.validate('button', 'selectAll', 1)){
							ctrlTxt = '<i class="icon icon-all mr-1"></i>'+Engine.Contents.Language['All'];
							table.DataTable().button().add(0,{ text: ctrlTxt, extend: 'selectAll' });
						}
						if(Engine.Auth.validate('button', 'add', 1)){
							ctrlTxt = '<i class="icon icon-add mr-1"></i>'+Engine.Contents.Language['Add'];
							table.DataTable().button().add(0,{
								text: ctrlTxt,
								action: function(){
									Engine.Builder.modal($('body'), {
										title:'Select a subscription',
										icon:'question',
										zindex:'top',
										css:{ dialog:"",header:"bg-info",body:""},
									}, function(modal){
										var dialog = modal.find('.modal-dialog');
										var header = modal.find('.modal-header');
										var body = modal.find('.modal-body');
										var footer = modal.find('.modal-footer');
										var html = "";
										header.find('button[data-control="hide"]').remove();
										header.find('button[data-control="update"]').remove();
										footer.append('<button type="submit" class="btn btn-info"><i class="icon icon-hide mr-1"></i>'+Engine.Contents.Language['Add']+'</button>');
										html += '<div class="input-group">';
											html += '<div class="input-group-prepend"><span class="input-group-text"><i class="icon icon-subscriptions mr-1"></i>'+Engine.Contents.Language['Subscriptions']+'</span></div>';
											html += '<select id="category" name="category" class="form-control">';
												for(var [key, category] of Object.entries(data.output.categories)){ html += '<option value="'+category.name+'">'+Engine.Helper.ucfirst(category.name)+'</option>'; }
											html += '</select>';
											html += '<select id="sub_category" name="sub_category" class="form-control">';
												for(var [key, sub_category] of Object.entries(data.output.sub_categories)){ html += '<option value="'+sub_category.name+'">'+Engine.Helper.ucfirst(sub_category.name)+'</option>'; }
											html += '</select>';
										html += '</div>';
										body.html(html);
										body.find('select').select2({ theme: 'bootstrap4' });
										footer.find('button').off().click(function(){
											var category = body.find("#category").select2('data')[0].element.value;
											var sub_category = body.find("#sub_category").select2('data')[0].element.value;
											Engine.request('users','subscribe',{data:{category:category,sub_category:sub_category}},function(result){
												json = JSON.parse(result);
												if(json.success != undefined){
													table.DataTable().row.add({ category:json.output.subscription.category, sub_category:json.output.subscription.sub_category }).draw(false);
												}
											});
											modal.modal('hide');
										});
										modal.modal('show');
									});
								}
							});
						}
						if(Engine.Auth.validate('button', 'delete', 1)){
							ctrlTxt = '<i class="icon icon-delete mr-1"></i>'+Engine.Contents.Language['Delete'];
							table.DataTable().button().add(0,{
								text: ctrlTxt,
								action: function(){
									table.DataTable().rows( { selected: true } ).every(function(){
										var row = this;
										var subscription = row.data();
										Engine.request('users','unsubscribe',{data:{category:subscription.category,sub_category:subscription.sub_category}},function(result){
											json = JSON.parse(result);
											if(json.success != undefined){
												table.DataTable().rows( { selected: true } ).every(function(){
													if(this.data().category == json.output.subscription.category && this.data().sub_category == json.output.subscription.sub_category){
														this.remove().draw(false);
													}
												});
											}
										});
									});
								}
							});
						}
					});
				}
			});
		},
	},
	Tabs:{
		init:function(){
			Engine.Plugins.profile.element.tabs.main.tab = $('#profileTabs');
			Engine.Plugins.profile.element.tabs.main.tabHeaders = Engine.Plugins.profile.element.tabs.main.tab.find('.nav-pills');
			Engine.Plugins.profile.element.tabs.main.tabContents = Engine.Plugins.profile.element.tabs.main.tab.find('.tab-content').first();
			Engine.Plugins.profile.Settings.init();
		},
		add:function(title, callback = null){
			Engine.Plugins.profile.element.tabs.main.tabHeaders.append('<li class="nav-item"><a class="nav-link" href="#tab-content-'+title+'" data-toggle="tab"><i class="icon icon-'+title+' mr-2"></i>'+Engine.Contents.Language[Engine.Helper.ucfirst(title)]+'</a></li>');
			Engine.Plugins.profile.element.tabs.main.tabContents.append('<div class="tab-pane active" id="tab-content-'+title+'">');
			Engine.Plugins.profile.element.tabs.main.tabHeaders.find('.nav-link').removeClass('active');
			Engine.Plugins.profile.element.tabs.main.tabHeaders.find('.nav-link').first().addClass('active');
			Engine.Plugins.profile.element.tabs.main.tabContents.find('.tab-pane').removeClass('active');
			Engine.Plugins.profile.element.tabs.main.tabContents.find('.tab-pane').first().addClass('active');
			if(callback != null){ callback(Engine.Plugins.profile.element.tabs.main.tabContents.find('.tab-pane').last(),Engine.Plugins.profile.element.tabs.main.tabHeaders.find('.nav-link').last()); }
		},
	},
	Settings:{
		init:function(){
			Engine.Plugins.profile.Tabs.add('settings',function(tab,header){
				tab.addClass('m-4');
				Engine.Plugins.profile.element.tabs.settings.tab = tab;
				tab.append('<div class="row"><div class="col-5 col-sm-3 p-0"><div class="nav flex-column nav-tabs h-100" role="tablist" aria-orientation="vertical"></div></div><div class="col-7 col-sm-9 p-0"><div class="tab-content"></div></div></div>');
				Engine.Plugins.profile.element.tabs.settings.tabHeaders = tab.find('.nav-tabs');
				Engine.Plugins.profile.element.tabs.settings.tabContents = tab.find('.tab-content');
			});
		},
		Tabs:{
			add:function(title, callback = null){
				var checkExist = setInterval(function(){
					if(!jQuery.isEmptyObject(Engine.Plugins.profile.element.tabs.settings.tabHeaders)){
						clearInterval(checkExist);
						var html = '';
						html += '<a class="nav-link" id="profileSettingsTabs-'+title.replace(/\//g, "").toLowerCase()+'-tab" data-toggle="pill" href="#profileSettingsTabs-'+title.replace(/\//g, "").toLowerCase()+'" role="tab" aria-controls="profileSettingsTabs-'+title.replace(/\//g, "").toLowerCase()+'">';
						html += '<i class="icon icon-'+title.replace(/\//g, "").toLowerCase()+' mr-2"></i>'+Engine.Contents.Language[title]+'</a>';
						Engine.Plugins.profile.element.tabs.settings.tabHeaders.append(html);
						html = '<div class="tab-pane fade" id="profileSettingsTabs-'+title.replace(/\//g, "").toLowerCase()+'" role="tabpanel" aria-labelledby="profileSettingsTabs-'+title.replace(/\//g, "").toLowerCase()+'-tab"></div>';
						Engine.Plugins.profile.element.tabs.settings.tabContents.append(html);
						Engine.Plugins.profile.element.tabs.settings.tabHeaders.find('.nav-link').removeClass('active');
						Engine.Plugins.profile.element.tabs.settings.tabHeaders.find('.nav-link').first().addClass('active');
						Engine.Plugins.profile.element.tabs.settings.tabContents.find('.tab-pane').removeClass('show active');
						Engine.Plugins.profile.element.tabs.settings.tabContents.find('.tab-pane').first().addClass('show active');
						if(callback != null){ callback(Engine.Plugins.profile.element.tabs.settings.tabContents.find('.tab-pane').last(),Engine.Plugins.profile.element.tabs.settings.tabHeaders.find('.nav-link').last()); }
					}
				}, 100);
			},
		},
	},
	Widget:{
		Navbar:function(){
			var html = '';
			html += '<li class="nav-item dropdown user-menu">';
			  html += '<a href="#" class="nav-link dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
			    html += '<img src="./dist/img/default.png" class="user-image img-circle elevation-2" alt="User Image">';
			    html += '<span class="d-none d-md-inline">'+Engine.Contents.Auth.User.username+'</span>';
			  html += '</a>';
			  html += '<ul class="dropdown-menu dropdown-menu-lg dropdown-menu-right" style="left: inherit; right: 0px;">';
			    html += '<li class="user-header bg-primary">';
			      html += '<img src="./dist/img/default.png" class="img-circle elevation-2">';
			      html += '<p>';
							if(Engine.Contents.Auth.User.first_name+Engine.Contents.Auth.User.last_name != ''){
			        	html += Engine.Contents.Auth.User.first_name+' '+Engine.Contents.Auth.User.last_name+' - '+Engine.Contents.Auth.User.job_title;
							} else {
								html += Engine.Contents.Auth.User.username+' - '+Engine.Contents.Auth.User.job_title;
							}
			        html += '<small>Member since '+Engine.Contents.Auth.User.created+'</small>';
			      html += '</p>';
			    html += '</li>';
			    html += '<li class="user-footer">';
			      html += '<a href="?p=profile" class="btn btn-default btn-flat">Profile</a>';
			      html += '<a href="?logout='+Engine.Contents.Auth.User.token+'" class="btn btn-default btn-flat float-right">Sign out</a>';
			    html += '</li>';
			  html += '</ul>';
			html += '</li>';
			$('#navbar-right').prepend(html);
			$('#navbar-right .user-footer a[href^="?p="]').off("click");
			$('#navbar-right .user-footer a[href^="?p="]').click(function(action){
				action.preventDefault();
				Engine.GUI.Breadcrumbs.add(action.currentTarget.textContent, action.currentTarget.attributes.href.value);
				Engine.GUI.load($('#ContentFrame'),action.currentTarget.attributes.href.value);
			});
		},
		Sidebar:function(){
			var html = '';
			html += '<div data-toggle="collapse" href="#UserMenu" class="user-panel pointer mt-3 pb-3 d-flex">';
				html += '<div class="image">';
					html += '<img src="/dist/img/default.png" class="img-circle elevation-2">';
				html += '</div>';
				html += '<div class="info">';
					html += '<a class="d-block">'+Engine.Contents.Auth.User.username+'</a>';
				html += '</div>';
			html += '</div>';
			html += '<div id="UserMenu" class="collapse">';
				html += '<nav class="mt-2 ml-2">';
					html += '<ul class="nav nav-pills nav-sidebar flex-column nav-flat nav-child-indent" role="menu" data-accordion="false">';
						html += '<li class="nav-item">';
							html += '<a href="?p=profile" class="nav-link">';
								html += '<i class="nav-icon fas fa-user-circle" aria-hidden="true"></i>';
								html += '<p>'+Engine.Contents.Language['Profile']+'</p>';
							html += '</a>';
						html += '</li>';
						html += '<li class="nav-item">';
							html += '<a href="?logout='+Engine.Contents.Auth.User.token+'" class="nav-link">';
								html += '<i class="nav-icon fas fa-sign-out-alt" aria-hidden="true"></i>';
								html += '<p>'+Engine.Contents.Language['Sign Out']+'</p>';
							html += '</a>';
						html += '</li>';
					html += '</ul>';
				html += '</nav>';
			html += '</div>';
			Engine.GUI.Sidebar.Widget.add(html,function(widget){
				widget.find('#UserMenu a[href^="?p="]').click(function(action){
					action.preventDefault();
					Engine.GUI.Breadcrumbs.add(action.currentTarget.textContent, action.currentTarget.attributes.href.value);
					Engine.GUI.load($('#ContentFrame'),action.currentTarget.attributes.href.value);
				});
			});
		},
	},
}

Engine.Plugins.profile.init();
