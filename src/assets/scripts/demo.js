console.log('Demo!');


// anchor
$('.anchor').on('click', 'a', function (event) {
    event.preventDefault();
    const id = $(this).attr('href');
    const top = $(id).offset().top;
    $('body,html').animate({scrollTop: top + 40}, 1000);
});
// anchor


// adaptive menu
$('.main-nav__toggle--js').click(function () {
    $(this).next().slideToggle();
});
// adaptive menu
