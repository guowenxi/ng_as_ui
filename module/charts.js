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
app.controller("CHARTS", function ($rootScope, $scope, $http, $filter, $interval, $q, $timeout, rootUrlProduct) {
	var myChart;
	var firstLoad;
	//-------------------------默认参数声明-------------------------
	$scope.de_val = {
		chartsStyle:$scope.chartsStyle,
		chartResult: [],
		chartsClassName: '',
		chartsBoxClass: '',
		url: $scope.url && $scope.url != '' ? $scope.url : null,
		chartParams: $scope.chartParams != '' && $scope.chartParams && JSON.parse($scope.chartParams) ? JSON.parse($scope.chartParams) : null,
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
	$scope.promiseData.promise.then(function (_data) {
		$scope.de_val.chartResult = _data.data;
	});
	//判断动画层加载完成的方法
	$scope.animateDown = new $q.defer();
	//判断动画是否已加载完成
	$scope.animateDown.resolve({state: true});
	//两者均加载完成的时候调用的方法
	$scope.beLoad_charts = $q.all([$scope.promiseData.promise, $scope.animateDown.promise]);
	//判断数据与动画是否已完成
	$scope.beLoad_charts.then(function (_data) {
		if (_data[0].state && _data[1].state) {
			$scope.de_val.refresh ? $scope.replace_charts() : $scope.set_charts($scope.de_val.chartResult);
		}
	});
	//配色盘
	
	//关闭定时器
	$scope.$on("$destroy", function (data) {
		$interval.cancel($scope.timer);
	});
	//-------------------------获取数据-------------------------
	$scope.load_url = function () {
		if (!$scope.de_val.url) {
			console.error("CHARTS : 必须输入chartName:'" + $scope.de_val.chartsClassName + "'的url地址!");
			return;
		}
		$http({
			method: 'get',
			url: rootUrlProduct.query() + $scope.de_val.url,
			params: $scope.de_val.urlParams
		}).success(function (_data) {
			_data.success == 1 ? '' : console.error("CHARTS : chartName:'" + $scope.de_val.chartsClassName + "'的数据加载失败");
			//加载数据完成
			if(!firstLoad){
				//firstLoad判断第一次加载,之后直接获取数据;
				firstLoad =true;
				_data.state = true;
				$scope.promiseData.resolve(_data);
			}else{
				$scope.de_val.chartResult = _data.data;
				$scope.set_charts($scope.de_val.chartResult)
			}
		})
	};
	//-------------------------生成图表-------------------------
	$scope.set_charts = function (e) {
		//定义图表盒子
		myChart = echarts.init($scope.de_val.chartsBoxClass);
		myChart.clear();
		//设置图表
		myChart.setOption(set_option(e,$scope.de_val.chartsStyle));
	};

	//-------------------------定时获取新数据-------------------------
	$scope.replace_charts = function () {
		$interval.cancel($scope.timer);
		$scope.timer = $interval(function () {
			$scope.load_url();
		}, $scope.de_val.intervalTime);
	};

	

	
	
});

app.directive('charts', function () {
	var obj = {
		//指令在DOM中以什么形式声明; "E"=元素,"A"=属性,"C"=class,"M"=注释 默认为"A"
		restrict: "EA",
		//执行的优先级
		priority: 0,
		//true=优先级低于此指令的不生效 false=均生效
		terminal: false,
		//代表所链接HTML文件的字符串地址,也可以是跟template一样的函数
		template: '', //获取为其本身,固不需要配置url地址
		//true=显示原始标签,false=不显示原始标签
		replace: true,
		//false=继承父作用域,
		//true=表示继承父作用域，并创建自己的作用域（子作用域）,
		// {}=表示创建一个全新的隔离作用域,
		// 内部属性
		// "@" 绑定一个局部 scope 属性到当前 dom 节点的属性值 (单向绑定,向内影响)
		// "=" 通过 directive 的 attr 属性的值在局部 scope 的属性和父 scope 属性名之间建立双向绑定 (双向绑定,同时影响)
		// "&"  提供一种方式执行一个表达式在父 scope 的上下文中。如果没有指定 attr 名称，则属性名称为相同的本地名称(绑定事件,事件改变是可以是directive外的改变,内往外传)
		scope: {
			chartsStyle: '@chartsStyle', //charts样式
			url: '@url',	//charts的url地址
			urlParams: '@urlParams', //charts的url所需要的参数
			chartParams: '@chartParams', //charts配置的参数
			interval: '@interval', //是否轮询且轮询时间是多久,
			onClick:'='
		},
		//可以是字符串或者函数 (公共逻辑)
		//字符串可以指定控制器名称
		//函数为自己设定控制器逻辑
		controller: "CHARTS",
		link: function (scope, Element, Attrs) {
			//获取charts的名称(css,id)
			if (!Attrs.class && !Attrs.id) {
				console.error("CHARTS : 必须在标签内输入class或者id用来定位charts");
				return;
			}
			//charts的标签名称
			scope.de_val.chartsClassName = Attrs.id ? Attrs.id : Attrs.class;
			//获取charts的元素标签
			scope.de_val.chartsBoxClass = Attrs.class ?  document.getElementsByClassName(Attrs.class)[0] : document.getElementById(Attrs.id);
			//默认发起请求
			scope.load_url(scope.params);
		}
	};
	return obj;
});



var set_option =function (e,style) {
	//-------------------------图表参数-------------------------
	var option ;
	switch (style) {
		case "default_charts" :
			app.title = '坐标轴刻度与标签对齐';
			option = {
				color: ['#3398DB'],
				tooltip : {
					trigger: 'axis',
					axisPointer : {            // 坐标轴指示器，坐标轴触发有效
						type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
					}
				},
				grid: {
					left: '3%',
					right: '4%',
					bottom: '3%',
					containLabel: true
				},
				xAxis : [
					{
						type : 'category',
						data : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
						axisTick: {
							alignWithLabel: true
						}
					}
				],
				yAxis : [
					{
						type : 'value'
					}
				],
				series : [
					{
						name:'直接访问',
						type:'bar',
						barWidth: '60%',
						data:[10, 52, 200, 334, 390, 330, 220]
					}
				]
			};
			break;
	}
	return option ;
};