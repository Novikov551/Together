[Setup]
AppName=Together
AppVersion=1.0.0
AppPublisher=Novikov551
DefaultDirName={autopf}\Together
DefaultGroupName=Together
OutputDir=C:\Users\nikit\OneDrive\Desktop\Projects\Together\Together.Desktop\installer
OutputBaseFilename=TogetherSetup
SetupIconFile=C:\Users\nikit\OneDrive\Desktop\Projects\Together\Together.Desktop\Together.Desktop\icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Создать ярлык на рабочем столе"; GroupDescription: "Дополнительно:"

[Files]
Source: "C:\Users\nikit\OneDrive\Desktop\Projects\Together\Together.Desktop\Together.Desktop\bin\Release\net9.0-windows\win-x64\publish\Together.Desktop.exe"; DestDir: "{app}"; DestName: "Together.exe"; Flags: ignoreversion

[Icons]
Name: "{group}\Together"; Filename: "{app}\Together.exe"; WorkingDir: "{app}"
Name: "{group}\Удалить Together"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Together"; Filename: "{app}\Together.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\Together.exe"; Description: "Запустить Together"; Flags: nowait postinstall skipifsilent