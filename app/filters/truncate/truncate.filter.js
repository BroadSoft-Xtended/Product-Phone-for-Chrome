ucone.filter('truncate', function(){
  return function(value, length, maxLength, apply){
    //value = the string that is passed into the filter
    //length = the length that you want to truncate after on hover
    //maxLength = the length you want to truncate no matter what
    //apply = the switch to activate this control

    if(value.length > length && apply){
      return value.substr(0, length) + '...';
    }
    else if(value.length > maxLength){
      return value.substr(0, maxLength) + '...';
    }
    else{
      return value;
    }
  };
});