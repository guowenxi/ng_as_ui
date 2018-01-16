/**
 * Created by Administrator on 2016/12/19.
 */
/*
* 必须传入参数:
*  url(支持json) ,
*  可选参数:
*  urlParams
*
*
*
*
* */


app.controller("REPORT", function ($rootScope, $scope, $http, $filter, $interval, $q, $timeout, rootUrlProduct) {
	var firstLoad;
	//-------------------------默认参数声明-------------------------
	this.reportClassName = $scope.reportClassName;
	$scope.listResult= [];
	this.url= $scope.url && $scope.url != '' ? $scope.url : null;
	this.urlParams= $scope.urlParams != '' && $scope.urlParams && JSON.parse($scope.urlParams) ? JSON.parse($scope.urlParams) : '';
	this.C_width= window.innerWidth;
	this.C_height= window.innerHeight;
	this.intervalTime= $scope.interval != '' && $scope.interval ? $scope.interval : 5000;
	this.refresh= $scope.interval != '' && $scope.interval ? true : false;
	this.fontSize= '2vh';
	$scope.column = {};
	//保存图表数据
	//判断数据层加载完成的方法
	$scope.promiseData = new $q.defer();
	//判断是获取数据是否已获取
	//判断动画层加载完成的方法
	$scope.animateDown = new $q.defer();
	//判断动画是否已加载完成
	$scope.animateDown.resolve({state: true});
	//两者均加载完成的时候调用的方法
	$scope.beLoad_charts = $q.all([$scope.promiseData.promise, $scope.animateDown.promise]);
	//判断数据与动画是否已完成
	$scope.beLoad_charts.then(function (_data) {
		if (_data[0].state && _data[1].state) {
			this.refresh ? $scope.replace_report() : broadcast_data(_data[0]);
			//$scope.$broadcast("column",{data:_data[0].data})
		}
	});
	//关闭定时器
	$scope.$on("$destroy", function (data) {
		$interval.cancel($scope.timer);
	});
	
	$scope.load_url=function () {
		if (!this.url) {
			console.error("REPORT : 必须输入reportName:'" + this.reportClassName + "'的url地址!");
			return;
		}
		$http({
			method: 'get',
			url: this.url.indexOf('.json')>=0 ? this.url : rootUrlProduct.query() + this.url,
			params: this.urlParams
		}).success(function (_data) {
			//_data.success == 1 ? '' : console.error("REPORT : reportName:'" + this.reportClassName + "'的数据加载失败");
			//加载数据完成
			if(!firstLoad){
				//firstLoad判断第一次加载,之后直接获取数据;
				firstLoad =true;
				_data.state = true;
				$scope.promiseData.resolve(_data);
			}else{
				$scope.listResult = _data.data;
				broadcast_data(_data.data);
			}
		})
	};
	function broadcast_data(_data) {
		var title=[];
		angular.forEach($scope.column,function (i1,index) {
			var main = [];
			title.push(i1.label);
			for(var i2=0;i2<_data.length;i2++){
				main.push(_data[i2][i1.prop]);
			}
			$scope.$broadcast(i1.prop,main);
		});
		$scope.$broadcast('report_header',{data:title});
	}
	
	$scope.replace_report = function () {
		$interval.cancel($scope.timer);
		$scope.timer = $interval(function () {
			$scope.load_url();
		}, this.intervalTime);
	}
	
});

app.directive('report', function () {
	var obj = {
		//指令在DOM中以什么形式声明; "E"=元素,"A"=属性,"C"=class,"M"=注释 默认为"A"
		restrict: "EA",
		//执行的优先级
		priority: 0,
		//true=优先级低于此指令的不生效 false=均生效
		terminal: false,
		//代表所链接HTML文件的字符串地址,也可以是跟template一样的函数
		//templateUrl: 'module/report.html', //获取为其本身,固不需要配置url地址
		templateUrl:'module/report.html',
		//true=显示原始标签,false=不显示原始标签
		replace: false,
		//false=继承父作用域,
		//true=表示继承父作用域，并创建自己的作用域（子作用域）,
		// {}=表示创建一个全新的隔离作用域,
		// 内部属性
		// "@" 绑定一个局部 scope 属性到当前 dom 节点的属性值 (单向绑定,向内影响)
		// "=" 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定 (双向绑定,同时影响)
		// "&"  提供一种方式执行一个表达式在父 scope 的上下文中。如果没有指定 attr 名称，则属性名称为相同的本地名称(绑定事件,事件改变是可以是directive外的改变,内往外传)
		scope: {
			url: '@url',	//charts的url地址
			urlParams: '@urlParams', //charts的url所需要的参数
			interval: '@interval', //是否轮询且轮询时间是多久,
			user:'=',  //绑定参数
			click:'&' //绑定方法
		},
		//可以是字符串或者函数 (公共逻辑)
		//字符串可以指定控制器名称
		//函数为自己设定控制器逻辑
		controller: "REPORT",
		transclude:true,
/*		link: function (scope, Element, Attrs) {
			debugger
			debugger
		}*/
		compile : function (scope, Element) {
			return {
				pre: function preLink(scope, element, attr) {
					scope.reportClassName = attr.id ? attr.id : attr.class;
					scope.load_url();
				},
				post: function postLink(scope, element, attributes) {
					var u,allNum=0;
					scope.column = [];
					//获取子集列的各项参数;
					angular.forEach(element[0].children,function (e,index) {
						if(e.className=='as-report-main'){
							angular.forEach(e.children,function (ev,i) {
								scope.column.push({
									label:ev.attributes.label.value,
									prop:ev.attributes.prop.value,
									width:ev.attributes.width? ev.attributes.width.value : '10%',
									align:ev.attributes.align? ev.attributes.align.value : 'center',
								});
								if(scope.column[i].width.indexOf('%')>=0){
									u='%';
									allNum += scope.column[i].width.split("%").join("")*1;
								}else if(scope.column[i].width.indexOf('px')>=0){
									u='px';
									allNum += scope.column[i].width.split("px").join("")*1;
								}
							});
							//添加单位
							scope.allWidth = allNum + u;
						return ;
						}
					});
				}
			};
		}
	};
	return obj;
});

app.directive('column', function () {
	var obj = {
		//指令在DOM中以什么形式声明; "E"=元素,"A"=属性,"C"=class,"M"=注释 默认为"A"
		restrict: "EA",
		//执行的优先级
		priority: 0,
		//true=优先级低于此指令的不生效 false=均生效
		terminal: false,
		//代表所链接HTML文件的字符串地址,也可以是跟template一样的函数
		//templateUrl: 'module/report.html', //获取为其本身,固不需要配置url地址
		template:"<table style=\"width:100%;\">\n" +
		"    <colgroup>\n" +
		"        <col ng-repeat=\"t in main\" align=\"{{align}}\" width=\"100%\">\n" +
		"    </colgroup>\n" +
		"    <tbody>\n" +
		"        <tr  ng-repeat=\"t in main\">\n" +
		"            <td>\n" +
		"                {{t}}\n" +
		"                <span ng-transclude></span>\n" +
		"            </td>\n" +
		"        </tr>\n" +
		"    </tbody>\n" +
		"</table>",
		//true=显示原始标签,false=不显示原始标签
		replace: false,
		//false=继承父作用域,
		//true=表示继承父作用域，并创建自己的作用域（子作用域）,
		// {}=表示创建一个全新的隔离作用域,
		// 内部属性
		// "@" 绑定一个局部 scope 属性到当前 dom 节点的属性值 (单向绑定,向内影响)
		// "=" 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定 (双向绑定,同时影响)
		// "&"  提供一种方式执行一个表达式在父 scope 的上下文中。如果没有指定 attr 名称，则属性名称为相同的本地名称(绑定事件,事件改变是可以是directive外的改变,内往外传)
		scope:{
			label:'@',
			align:'@',
			width:'@',
			prop:'@'
		},
		//可以是字符串或者函数 (公共逻辑)
		//字符串可以指定控制器名称
		//函数为自己设定控制器逻辑
		controller: function ($rootScope, $scope, $http, $filter, $interval, $q, $timeout, rootUrlProduct) {
			$scope.$on($scope.prop,function (event,d) {
				$scope.main = d;
			});
		},
		require:'?^report',
		transclude:true,
		link: function (scope, Element, Attrs,ctl) {
			Element[0].style.width=Attrs.width ? Attrs.width : '10%';
			Element[0].style.float='left';
		}
	};
	return obj;
});

