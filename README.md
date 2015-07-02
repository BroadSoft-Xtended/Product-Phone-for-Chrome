# Broadsoft - Phone for Chrome

![](http://puu.sh/iKFuu/49b8df1956.png)

## Overview

The UC-One Phone for Chrome is a Google Chrome application.  It is designed to work with the BroadSoft UC-One platform.  To use this application, **_you must have a UC-One account from a service provider that is running the BroadSoft BroadWorks software._**   Your account must be properly provisioned with a Chrome-Phone as either a primary or secondary device.  

The Phone for Chrome allows incoming and outgoing voice and video calling from within the Chrome experience.  It uses the latest WebRTC engine built into the Google Chrome browser in conjunction with the WebRTC server capabilities on BroadSoft’s UC-One platform for a high quality voice and video calling experience.  The Phone for Chrome should work on any Chrome enabled platform — including Windows, Mac, Linux and of course any reasonably powered ChromeBook or ChromeBox.  

This is an Open Source product provided by the BroadSoft Xtended Open Source Initiative.  It was developed using the BroadSoft ExSIP library, and the BroadSoft Xtended APIs.  A reference implementation is available on the **Google Chrome Store**.  The source code is provided to service providers who wish to brand and customize the Phone for Chrome for their UC-One market offer.  

### The Phone for Chrome integrates with the following UC-One services on BroadWorks:

- **Personal Assistant:** You can easily select your Personal Assistant profile from the “Quick Pick” list in the top bar of the application.  If set to anything besides "Available" -- the Personal Assistant will answer incoming calls for you and provide an announcement indicating your current availability.  

![](http://puu.sh/iKQ8k/1aa0b1d48e.png)

Personal assistant will notify callers of your availability status.  If you want to provide a duration, you can navigate to the “Incoming” tab in the settings page and configure an “Until” message:

![](http://puu.sh/iKQ9G/38ab9ae96e.png)

Then the Personal Assistant will indicate to the caller how long you will be unavailable.  If you have someone who can answer you calls while you are away, you can configure a “Transfer To” number, and the Personal Assistant will give your callers the option to be transferred to your attendant.

Finally, you can configure a list of VIPs — people that will always get through to you, regardless of you Personal Assistant status:

![](http://puu.sh/iKQaS/497753e499.png) 

- **Call Forwarding Always:** The Phone for Chrome allows you to quickly configure and turn Call Forwarding on.  When enabled, your calls are always forwarded to that number until you turn Call Forwarding off.  Call Forwarding can be configured in the “Incoming” settings tab on the Phone for Chrome.

- **BroadWorks Anywhere:** The Phone for Chrome is designed to be deployed in conjunction with BroadWorks Anywhere.  BroadWorks Anywhere allows you to configure your mobile number. When enabled, both your mobile phone and your Phone for Chrome will ring whenever anyone calls your UC-One business number.

- **Selectivee Call Rejection:** The Phone for Chrome also allows you to choose to reject certain types of calls based on caller identity. You can choose to reject calls from specific calling numbers, calls from anonymous callers, or incoming calls set as private.

- **N-Way Calling:** The Phone for Chrome supports N-way calling for both voice and video calls.

- **Blind and Attended Transfer:** The Phone for Chrome supports blind and attended transfer.

- **Call History:** The Phone for Chrome allows you to get the details about the last 20 calls you placed, missed, or received.

- **Contacts:** The Phone for Chrome allows you to search for users in your UC-One telephone directory and quickly click to call them.

- **Favorites:** You can easily add a user to your “Favs” tab by selecting the “Add to Favorites” option from the contact.

To use the UC-One Phone for Chrome, the user must be provisioned with the services above. These services are included in the BroadWorks Premium Enterprise Seat.

## Documentation

[Configuring BroadWorks and Provisioning Users to use the UC-One Phone for Chrome](https://github.com/BroadSoft-Xtended/Product-Phone-for-Chrome/blob/master/documentation/BroadWorksConfiguration.md)

[Architecture Overview](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/Architecture.md)

[Help Develop this App](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/Development.md)

[Contribute to this App](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/HowToContributeToThisApplication.md)

[How to Brand this App](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/BrandingAndLogoChanges.md)

[Third Party Dependencies](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/Dependencies.md)

[Building and Packaging this app for Production](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/HowToBuildAndPackage.md)

[How to translate this app](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/TranslationAndAddingLanguages.md)
