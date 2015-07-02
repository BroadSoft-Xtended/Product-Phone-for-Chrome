## Configuring BroadWorks for UC-One Phone for Chrome

Phone for Chrome has been tested with BroadWorks Release 21.SP1.  It should also work with BroadWorks Release 20.SP1.  The latest BroadWorks patch level must be applied each release.

To use the Phone for Chrome, the BroadWorks system must be configured with a Device Profile Type called “Chrome-Phone”.   This process must be performed once for each BroadWorks system.  This configuration can be done by simply importing the “Chrome-Phone” Device Type Archive File (DTAF).  It can be downloaded from the Phone for Chrome project on the Xtended Open Source Initiative group on GitHub.  

To import the DTAF and configure BroadWorks for use with the UC-One Phone for Chrome -- follow these steps:

1) Download the DTAF file and unzip it.  

2)     Log in to BroadWorks as an administrator.

3)     Browse to System → Resources → Identity/Device Profile Types and then click Import.

4)     Select Browse to find the extracted DTAF file for the model and then click OK to start the import.

After the import finishes, a new “Chrome-Phone” device profile type will be added to the BroadWorks system.  To complete the configuration, perform the following post-import configuration steps:

5)     Browse to System → Resources → Identity/Device Profile Types.

6)     Perform a search to find the imported "Chrome-Phone" device profile type.

7)     Browse to the Profile page and change the "Device Management Device Access FQDN" to your Xtended Services Platform (Xsp) or Xtended Services Platform cluster address.

8)   Browse to System → Resources → Device Management Tag Sets and select the System Default tag set. 

9)  The UC-One Phone for Chrome configuration templates makes use of the tags in the following table.  Add the tags if they do not already exist.

![](http://puu.sh/iKVfQ/b316e76b48.png)

Now your system is ready to provision users with the UC-One Phone fro Chrome.   

## Provisioning Users for UC-One Phone for Chrome

To use the UC-One Phone for Chrome, users simply login with their BroadWorks username and password.  The reference Chrome Application published by BroadSoft on the Chrome Web store can be connected to any Xsp with BroadWorks Xsi-Actions and Device Management support.  

Users on BroadWorks must first be provisioned with either a primary or secondary device of type Chrome-Phone.  To provision users with UC-One Phone for Chrome — follow these steps:

1a)  If this is to be a “primary device” on the user, search and select the user being provisioned and navigate to:  Profile → Addresses

1b)  If this is to be a “secondary device” on the user, search and select the user being provisioned and navigate to:  Call Control → Shared Call Appearance:  and click “Add”.

2)  For “Identity/Device Profile Name”, select: “New Identity / Device Profile”  from the drop down.

3)  Choose a unique name for the “New Identity/Device Profile Name” attribute.

4)  Choose “Chrome-Phone” from the “Identity/Device Profile Type” drop down.

5)  Choose a unique line/port for the “Line/Port” attribute.

5)  Push “OK” to create the Device Profile Instance.

Now the user’s device instance has been created, but the device management profile must be initialized with a username and password.

6a)  If this is to be a “primary device” on the user, search and select the user being provisioned and navigate to:  Call Control → Shared Call Appearance:  and click “Configure Identity/Device Profile”

6b)    If this is to be a “secondary device” on the user, search and select the user being provisioned and navigate to:  Call Control → Shared Call Appearance:  and click “Edit” next to the “Chrome-Phone” device profile line.  Then click  “Configure Identity/Device Profile”.

7)  On the “Profile” tab,  click “Use Custom Credentials” and enter a unique Device Access User Name and a corresponding Device Access Password.

Now the user should be able to login to the UC-One Phone for Chrome.
