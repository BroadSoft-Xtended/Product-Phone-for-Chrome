describe('personal assistant factory', function () {
  beforeEach(module('ucone'));

  describe('formatPAData', function(){
    it('should return the proper expiration time', inject(function(Broadsoft){
      var data = {expirationTime: {$:'2012-02-02T04:00.000-400'}};
      expect(Broadsoft.formatPAData(data).expirationTime).to.equal('04:00');
      expect(Broadsoft.formatPAData(data).expirationDate).to.equal('2012-02-02');
    }));
  })
});