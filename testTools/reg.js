const getRemainItems = function( arr, str, key ){
	if( typeof str !== 'string' && !(str instanceof Array) ){
		throw Error('请传递正确的参数, function/str')
	}
	if( str instanceof Array ){
		str = str.join(',')
	}
	let newArr = [...arr];
	for( let i = 0; i < newArr.length; i++ ){
		let testStr = newArr[i][key],
			regStr = `/(,${testStr})|(,${testStr}$)|(^${testStr},)|(^${testStr}$)/g`,
			regExp = eval(regStr);
		if( regExp.test(str) ){
			newArr.splice( i, 1 );
			console.log( newArr );
			--i;
		}
	}
	return newArr
}

var a = [
    {
        id: 'aa'
    },
    {
        id: 'bb'
    },
    {
        id: 'cc'
    },
    {
        id: 'dd'
    },
    {
        id: 'aaa'
    },
    {
        id: 'aa'
    },
    {
        id: 'aa'
    }
]

var str = "aa,aaa"
var key = 'id';
console.log( 1 );
console.log( getRemainItems( a, str, key ) )
