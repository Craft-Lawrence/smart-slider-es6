$( document ).ready(function() {

	/* Поиск картинок в интернете */
	function f_search(search, count) {
		$.ajax({
			url: 'http://foxk.ru/search.php?count='+count+'&string='+search,
			type: "GET", // POST/GET
			crossDomain : true,
			async: false,
			dataType: "json",
			success: function(json) {
				$('#results_container .item').remove();
				//console.log(json);

				for (var i = 0; i < json.data.result.items.length; i++) {
					var title = json.data.result.items[i].title;
					var media = json.data.result.items[i].media;
					//var thumbnail = json.data.result.items[i].thumbnail;
					
					$('#results_container').append('<div class="item"><img src="'+media+'"><div class="bottom"><span class="title">'+title+'</span><a href="'+media+'" target="_blank" download="somefilename.jpg">Добавить</a></div></div>');
				}
			}
		});

		return false;
	}

	$('form').submit(function() {
		var count	= $(this).find('select').val();
		var search	= $(this).find('input[name="search"]').val();

		f_search(search, count);

		return false;
	});

	$('select').change(function() {
		var count = $(this).find('option:selected').val(),
			search	= $('form input[name="search"]').val();

		f_search(search, count);

		Cookies.set('count', count, { expires: 365 });
	});

	if ( Cookies.get('count') != '' ) {
		$("select option[value=" + Cookies.get('count') + "]").attr('selected', 'true');
	}
	/* /Поиск картинок в интернете */


	
	/* Добавление слайдов в куку + слайдер */
	$('#results_container').on('click', '.item a', function() {
		let src = $(this).attr('href'); // получаем href ссылки, по которой кликнули

		let srcs = []; // создаём пустой массив

		if ( Cookies.get('srcs') !== undefined ) { // если кука уже существует, то...
			var temp = Cookies.get('srcs'); // получаем эту куку (она пока что строка)
			srcs = JSON.parse(temp); // преобразовываем строку в json-объект (по сути это массив)
		}
		srcs.push(src); // добавляем новую картинку в конец массива

		Cookies.set('srcs', JSON.stringify(srcs), { expires: 365 }); // записываем массив в куку

		slide_add( src );

		return false;
	});
	/* /Добавление слайдов в куку + слайдер */


	/* Получаю слайды с куки, добавляю в слайдер, и инициализирую его */
	function slide_add( src_f ) {

		// Ещё один способ создавать динамические элементы
		/*let item = $('<div/>', {
				class: 'item',
			});

		let img_box = $('<div/>', {
				class: 'img_box',
			}).appendTo(item);

		let img = $('<img/>', {
				src: src_f,
			}).appendTo(img_box);*/
		// /Ещё один способ создавать динамические элементы

		// Добавляю слайд
		$('.slick_slider').slick('slickAdd','<div class="item"><div class="img_box"><img src="'+src_f+'"></div></div>');
	}

	if ( Cookies.get('srcs') !== undefined ) {
		let array = JSON.parse(Cookies.get('srcs')); // Преобразовываю строку из куки в json-объект

		$('.slick_slider').slick(); // Инициализирую слайдер
		
		for (var i = 0; i < array.length; i++) // Перебираю слайды, полученные с куки
			slide_add( array[i] ); // Добавляю элементы в слайдер слайды
	}
	/* /Получаю слайды с куки, добавляю в слайдер, и инициализирую его */


});