'use strict';

$(function() {

  // Scroll to Top
  $('a[href^="#"]').on('click', function () {
      $('body,html').animate({scrollTop: 0}, 800);
      return false;
  });

});