describe('utility factory', function () {
  beforeEach(module('ucone'));

  describe('getTimesForDropDown', function () {
    it('should return a full list of times', inject(function (Utility) {
      expect(Utility.getTimesForDropDown().length).to.equal(96);
      expect(Utility.getTimesForDropDown().indexOf('09:45') > -1).to.equal(true);
      expect(Utility.getTimesForDropDown().indexOf('22:15') > -1).to.equal(true);
      expect(Utility.getTimesForDropDown().indexOf('12:00') > -1).to.equal(true);
      expect(Utility.getTimesForDropDown().indexOf('00:00') > -1).to.equal(true);
    }));
  });

  describe('sanitizeDates', function () {
    it('should return a full list of times', inject(function (Utility) {
      expect(Utility.sanitizeDates('2012-01-01')).to.equal('2012-01-01');
      expect(Utility.sanitizeDates('2012/01/01')).to.equal('2012-01-01');
      expect(Utility.sanitizeDates('2012 01 01')).to.equal('2012-01-01');
    }));
  });
});