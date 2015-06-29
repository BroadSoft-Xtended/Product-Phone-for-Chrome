describe('directories factory', function () {
  beforeEach(module('ucone'));

  describe('initBroadsoftContacts', function () {
    it('should return an empty array with no contacts', inject(function (Broadsoft) {
      var contacts = Broadsoft.initBroadsoftContacts([]);
      expect(contacts.length).to.equal(0);
    }));

    it('should return an array of one when passed a contact object', inject(function (Broadsoft) {
      var objectContacts = Broadsoft.initBroadsoftContacts({firstName: 'foo', lastName: 'bar', number: '', id: '', mobileNumber: ''});
      expect(objectContacts.length).to.equal(1);
    }));
  });
});