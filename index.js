
var app=angular.module('myapp',['ui.router','oc.lazyLoad']);
app.controller("indexCtrl",function($scope,rootUrlProduct,websocketUrl,$timeout,$interval,$http,$state,$element,$rootScope){
	
	rootUrlProduct.add('http://172.18.13.100:8080/um');
	websocketUrl.add('ws://172.18.13.100:8080');


	$scope.listName2="123";
/*	$scope.$watch("listName2",function (newVal) {
		$scope.listName2= newVal;
		debugger
	})*/
	
	
});



app.config(function($httpProvider) {
	//全局路由转义变量;
	$httpProvider.defaults.transformRequest = function(obj){
		var str = [];
		for(var p in obj){
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
		return str.join("&");
	};
	$httpProvider.defaults.headers.post = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};
	$httpProvider.defaults.headers.delete = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};
	
	
});


//路由配置


app.factory("rootUrlProduct",function(){
	var root_url='';
	return {
		query:function(){
			return root_url;
		},
		add:function(url){
			root_url=url;
		}
	}
});

app.factory("websocketUrl",function(){
	var root_url='';
	return {
		query:function(){
			return root_url;
		},
		add:function(url){
			root_url=url;
		}
	}
});





//判断浏览器的方法
function myBrowser(){
	var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
	if (userAgent.indexOf("Opera") > -1) {
		return "Opera"
	} //判断是否Opera浏览器
	if (userAgent.indexOf("Firefox") > -1) {
		return "FF";
	} //判断是否Firefox浏览器
	if (userAgent.indexOf("Chrome") > -1){
		return "Chrome";
	}
	if (userAgent.indexOf("Safari") > -1) {
		return "Safari";
	} //判断是否Safari浏览器
	if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera) {
		return "IE";
	} //判断是否IE浏览器
	if (!!window.ActiveXObject || "ActiveXObject" in window) {
		return "IE";
	} //判断是否IE浏览器
	//"Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; .NET4.0E; .NET4.0C; .NET CLR 3.5.30729; .NET CLR 2.0.50727; .NET CLR 3.0.30729; BRI/2; rv:11.0) like Gecko"
}









app.config(function ($provide, $compileProvider, $controllerProvider, $filterProvider) {
	app.controller = $controllerProvider.register;
	app.directive = $compileProvider.directive;
	app.filter = $filterProvider.register;
	app.factory = $provide.factory;
	app.service = $provide.service;
	app.constant = $provide.constant;
});
app.constant('Modules_Config', [
	{
		name: 'treeControl',
		serie: true,
		files: []
	}
]);

app.config(["$ocLazyLoadProvider","Modules_Config",routeFn]);
function routeFn($ocLazyLoadProvider,Modules_Config){
	$ocLazyLoadProvider.config({
		debug:false,
		events:false,
		modules:Modules_Config
	});
	
};


