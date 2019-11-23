/*
 |  tail.select - The vanilla solution to make your HTML select fields AWESOME!
 |  @file       ./langs/tail.select-fa.js
 |  @author     SamBrishes <sam@pytes.net>
 |  @version    0.5.16 - Beta
 |
 |  @website    https://github.com/pytesNET/tail.select
 |  @license    X11 / MIT License
 |  @copyright  Copyright © 2014 - 2019 SamBrishes, pytesNET <info@pytes.net>
 */
/*
 |  Translator:     Javad Adib - (https://github.com/MrJavadAdib)
 |  GitHub:         https://github.com/pytesNET/tail.select/pull/xx
 */
;(function(factory){
   if(typeof(define) == "function" && define.amd){
       define(function(){
           return function(select){ factory(select); };
       });
   } else {
       if(typeof(window.tail) != "undefined" && window.tail.select){
           factory(window.tail.select);
       }
   }
}(function(select){
    select.strings.register("fa", {
        all: "همه",
        none: "هیچ‌کدام",
        empty: "خالی",
        emptySearch: "خالی کردن جستجو",
        limit: "محدودیت",
        placeholder: "نگهدارنده",
        placeholderMulti: "نگهدارنده چندتایی",
        search: "جستجو",
        disabled: "غیرفعال"
    });
    return select;
}));
