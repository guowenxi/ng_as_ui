/**
 * Created by Administrator on 2016/12/19.
 */
/*
* 必须传入参数:
*  url , chartsStyle
*  可选参数:
*	chartParams , urlParams
*
*
*
*
* */


app.controller("REPORT", function ($rootScope, $scope, $http, $filter, $interval, $q, $timeout, rootUrlProduct) {
	var firstLoad;
	//-------------------------默认参数声明-------------------------
	$scope.de_val = {
		reportClassName:'',
		listResult: [],
		url: $scope.url && $scope.url != '' ? $scope.url : null,
		urlParams: $scope.urlParams != '' && $scope.urlParams && JSON.parse($scope.urlParams) ? JSON.parse($scope.urlParams) : '',
		C_width: window.innerWidth,
		C_height: window.innerHeight,
		intervalTime: $scope.interval != '' && $scope.interval ? $scope.interval : 5000,
		refresh: $scope.interval != '' && $scope.interval ? true : false,
		fontSize: '2vh'
	};
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
			$scope.de_val.refresh ? $scope.replace_report() : $scope.de_val.listResult = _data[0].data;
		}
	});
	//关闭定时器
	$scope.$on("$destroy", function (data) {
		$interval.cancel($scope.timer);
	});
	
	$scope.load_url=function () {
		if (!$scope.de_val.url) {
			console.error("CHARTS : 必须输入chartName:'" + $scope.de_val.chartsClassName + "'的url地址!");
			return;
		}
		$http({
			method: 'get',
			url: rootUrlProduct.query() + $scope.de_val.url,
			params: $scope.de_val.urlParams
		}).success(function (_data) {
			_data.success == 1 ? '' : console.error("REPORT : reportName:'" + $scope.de_val.reportClassName + "'的数据加载失败");
			//加载数据完成
			if(!firstLoad){
				//firstLoad判断第一次加载,之后直接获取数据;
				firstLoad =true;
				_data.state = true;
				$scope.promiseData.resolve(_data);
			}else{
				$scope.de_val.listResult = _data.data;
			}
		})
	};
	
	$scope.load_url();
	
	$scope.replace_report = function () {
		$interval.cancel($scope.timer);
		$scope.timer = $interval(function () {
			$scope.load_url();
		}, $scope.de_val.intervalTime);
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
		template:function (Element, Attrs) {
			var DOM = []
			for(var i=0;i<Element[0].children.length;i++){
				DOM.push(Element[0].children[i]);
			}
			return DOM ;
			//return   [Element[0].children[0],Element[0].children[1]] ;
		},
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
		link: function (scope, Element, Attrs) {
			scope.de_val.reportClassName = Attrs.id ? Attrs.id : Attrs.class;
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
		template:'<div>123123</div>',
		//true=显示原始标签,false=不显示原始标签
		replace: false,
		//false=继承父作用域,
		//true=表示继承父作用域，并创建自己的作用域（子作用域）,
		// {}=表示创建一个全新的隔离作用域,
		// 内部属性
		// "@" 绑定一个局部 scope 属性到当前 dom 节点的属性值 (单向绑定,向内影响)
		// "=" 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定 (双向绑定,同时影响)
		// "&"  提供一种方式执行一个表达式在父 scope 的上下文中。如果没有指定 attr 名称，则属性名称为相同的本地名称(绑定事件,事件改变是可以是directive外的改变,内往外传)
		scope: false,
		//可以是字符串或者函数 (公共逻辑)
		//字符串可以指定控制器名称
		//函数为自己设定控制器逻辑
		controller: function ($scope) {
			debugger
			$scope.de_val = [];
		},
		link: function (scope, Element, Attrs) {
		
		}
	};
	return obj;
});
app.directive('reportHeader', function () {
	var obj = {
		//指令在DOM中以什么形式声明; "E"=元素,"A"=属性,"C"=class,"M"=注释 默认为"A"
		restrict: "EA",
		//执行的优先级
		priority: 0,
		//true=优先级低于此指令的不生效 false=均生效
		terminal: false,
		//代表所链接HTML文件的字符串地址,也可以是跟template一样的函数
		//templateUrl: 'module/report.html', //获取为其本身,固不需要配置url地址
		template:'<div>55555</div>',
		//true=显示原始标签,false=不显示原始标签
		replace: false,
		//false=继承父作用域,
		//true=表示继承父作用域，并创建自己的作用域（子作用域）,
		// {}=表示创建一个全新的隔离作用域,
		// 内部属性
		// "@" 绑定一个局部 scope 属性到当前 dom 节点的属性值 (单向绑定,向内影响)
		// "=" 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定 (双向绑定,同时影响)
		// "&"  提供一种方式执行一个表达式在父 scope 的上下文中。如果没有指定 attr 名称，则属性名称为相同的本地名称(绑定事件,事件改变是可以是directive外的改变,内往外传)
		scope: false,
		//可以是字符串或者函数 (公共逻辑)
		//字符串可以指定控制器名称
		//函数为自己设定控制器逻辑
		//controller: "COLUMN",
		link: function (scope, Element, Attrs) {
				debugger
		}
	};
	return obj;
});

