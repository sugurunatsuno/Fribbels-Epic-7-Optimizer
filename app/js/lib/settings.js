const { remote } = require('electron')
const dialog = remote.dialog;
const currentWindow = remote.getCurrentWindow();
const documentsPath = remote.app.getPath('documents');
const savesFolder = documentsPath + '/FribbelsOptimizerSaves';

const defaultPath = savesFolder;

const settingsPath = defaultPath + "/settings.ini";
var pathOverride;

var excludeSelects = [];
var defaultOptimizerSettings = {
    settingDefaultUseReforgedStats: true,
    settingDefaultUseHeroPriority: false,
    settingDefaultUseSubstatMods: false,
    settingDefaultLockedItems: false,
    settingDefaultEquippedItems: false,
    settingDefaultKeepCurrent: false,
}

module.exports = {
    initialize: async () => {
        await module.exports.loadSettings();

        // Format numbers
        $("#settingMaxResults").on("keyup", function(event ) {
            // When user select text in the document, also abort.
            var selection = window.getSelection().toString();
            if (selection !== '') {
                return;
            }
            // When the arrow keys are pressed, abort.
            if ($.inArray(event.keyCode, [38, 40, 37, 39]) !== -1) {
                return;
            }
            var $this = $(this);
            // Get the value.
            var input = $this.val();
            input = input.replace(/[\D\s\._\-]+/g, "");
            input = input?parseInt(input, 10):0;
            $this.val(function () {
                return (input === 0)?"":input.toLocaleString("en-US");
            });
        });

        const settingsIds = [
            'settingUnlockOnUnequip',
            'settingMaxResults',
            'settingRageSet',
            'settingDefaultUseReforgedStats',
            'settingDefaultUseHeroPriority',
            'settingDefaultUseSubstatMods',
            'settingDefaultLockedItems',
            'settingDefaultEquippedItems',
            'settingDefaultKeepCurrent',
        ];

        $('#optionsExcludeGearFrom').change(module.exports.saveSettings)
        $('#darkSlider').change(module.exports.saveSettings)

        for (var id of settingsIds) {
            document.getElementById(id).addEventListener('change', (event) => {
                module.exports.saveSettings();
            });
        }

        document.getElementById('selectDefaultFolderSubmit').addEventListener("click", async () => {
            const options = {
                title: "Open folder",
                defaultPath : module.exports.getDefaultPath(),
                buttonLabel : "Open folder",
                properties: ['openDirectory'],
            }

            const filenames = dialog.showOpenDialogSync(currentWindow, options);
            console.log(filenames);

            if (!filenames || filenames.length < 1) {
                return console.warn("Invalid filename")
            };

            const path = Files.path(filenames[0]);
            pathOverride = path;
            module.exports.saveSettings();
            $('#selectDefaultFolderSubmitOutputText').text(`New saves folder: ${path}`);

            Notifier.info(path);
        });
    },

    getDefaultPath: () => {
        return Files.path(pathOverride || defaultPath);
    },

    getExcludeSelects: () => {
        return excludeSelects;
    },

    getOptimizerOptions: () => {
        return defaultOptimizerSettings;
    },

    getDefaultSettings: () => {
        return {
            settingUnlockOnUnequip: true,
            settingRageSet: true,
            settingMaxResults: 5_000_000,
            settingDefaultPath: defaultPath,
            settingExcludeEquipped: [],
            settingDarkMode: true,
            settingDefaultUseReforgedStats: true,
            settingDefaultUseHeroPriority: false,
            settingDefaultUseSubstatMods: false,
            settingDefaultLockedItems: false,
            settingDefaultEquippedItems: false,
            settingDefaultKeepCurrent: false,
            settingBackgroundColor: '#212529',
            settingTextColorPicker: '#E2E2E2',
            settingAccentColorPicker: '#F84C48',
            settingInputColorPicker: '#2D3136',
            settingGridTextColorPicker: '#E2E2E2',
            settingRedColorPicker: '#5A1A06',
            settingNeutralColorPicker: '#343127',
            settingGreenColorPicker: '#38821F'
        }
    },

    parseMaxResults: () => {
        var value = document.getElementById('settingMaxResults').value;
        value = value.replace(/,/g, "")

        return parseInt(value);
    },

    loadSettings: async () => {
        try {
            Saves.createFolder();
        } catch (e) {
            Notifier.error("Unable to create the Documents/FribbelsOptimizerSaves folder. Try disabling running the app as admin and disabling your virus scan");
            return;
        }

        console.log("LOAD SETTINGS", settingsPath);
        const text = await Files.readFileSync(Files.path(settingsPath));
        const settings = JSON.parse(text);
        console.log("LOADING SETTINGS", settings);

        function isNullUndefined(x) {
            return x === null || x === undefined;
        }

        document.getElementById('settingUnlockOnUnequip').checked = settings.settingUnlockOnUnequip;
        document.getElementById('settingRageSet').checked = settings.settingRageSet;
        document.getElementById('settingDefaultUseReforgedStats').checked = isNullUndefined(settings.settingDefaultUseReforgedStats) ? true : settings.settingDefaultUseReforgedStats;
        document.getElementById('settingDefaultUseHeroPriority').checked = settings.settingDefaultUseHeroPriority;
        document.getElementById('settingDefaultUseSubstatMods').checked = settings.settingDefaultUseSubstatMods;
        document.getElementById('settingDefaultLockedItems').checked = settings.settingDefaultLockedItems;
        document.getElementById('settingDefaultEquippedItems').checked = settings.settingDefaultEquippedItems;
        document.getElementById('settingDefaultKeepCurrent').checked = settings.settingDefaultKeepCurrent;
        defaultOptimizerSettings = {
            settingDefaultUseReforgedStats: isNullUndefined(settings.settingDefaultUseReforgedStats) ? true : settings.settingDefaultUseReforgedStats,
            settingDefaultUseHeroPriority: settings.settingDefaultUseHeroPriority,
            settingDefaultUseSubstatMods: settings.settingDefaultUseSubstatMods,
            settingDefaultLockedItems: settings.settingDefaultLockedItems,
            settingDefaultEquippedItems: settings.settingDefaultEquippedItems,
            settingDefaultKeepCurrent: settings.settingDefaultKeepCurrent
        }
        pathOverride = settings.settingDefaultPath;

        console.warn("changing path override to: " + pathOverride);

        if (settings.settingMaxResults) {
            document.getElementById('settingMaxResults').value = settings.settingMaxResults.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        if (settings.settingDarkMode) {
            document.getElementById('darkSlider').checked = true;
            DarkMode.toggle();
        }

        if (settings.settingExcludeEquipped) {
            console.log("BEFORE", $('#optionsExcludeGearFrom').multipleSelect('getOptions'))
            console.log("BEFORE", $('#optionsExcludeGearFrom').multipleSelect('getSelects'))
            $('#optionsExcludeGearFrom').multipleSelect('setSelects', settings.settingExcludeEquipped)
            console.log("AFTER", $('#optionsExcludeGearFrom').multipleSelect('getSelects'))
            excludeSelects = settings.settingExcludeEquipped;
        }

  // "settingBackgroundColor": "#212529",
  // "settingTextColorPicker": "#e2e2e2",
  // "settingAccentColorPicker": "#f84c48",
  // "settingInputColorPicker": "#2d3136",
  // "settingGridTextColorPicker": "#ffffff",
  // "settingRedColorPicker": "#ff430a",
  // "settingNeutralColorPicker": "#343127",
  // "settingGreenColorPicker": "#38821f"

        console.warn(settings);
        ColorPicker.loadColorSettings(settings)

        const currentVersion = Updater.getCurrentVersion();
        if (settings.settingVersion) {
            if (currentVersion != settings.settingVersion) {

                Updater.showNewFeatures(currentVersion);
                module.exports.saveSettings();
            }
        } else {
            Updater.showNewFeatures(currentVersion);
            module.exports.saveSettings();
        }

        $('#selectDefaultFolderSubmitOutputText').text(settings.settingDefaultPath || defaultPath);
        Api.setSettings(settings);
    },

    saveSettings: async () => {
        try {
            Saves.createFolder();
        } catch (e) {
            Notifier.error("Unable to create the Documents/FribbelsOptimizerSaves folder. Try disabling running the app as admin and disabling your virus scan");
            return;
        }

        console.log("SAVE SETTINGS");
        const settings = {
            settingUnlockOnUnequip: document.getElementById('settingUnlockOnUnequip').checked,
            settingRageSet: document.getElementById('settingRageSet').checked,
            settingDefaultUseReforgedStats: document.getElementById('settingDefaultUseReforgedStats').checked,
            settingDefaultUseHeroPriority: document.getElementById('settingDefaultUseHeroPriority').checked,
            settingDefaultUseSubstatMods: document.getElementById('settingDefaultUseSubstatMods').checked,
            settingDefaultLockedItems: document.getElementById('settingDefaultLockedItems').checked,
            settingDefaultEquippedItems: document.getElementById('settingDefaultEquippedItems').checked,
            settingDefaultKeepCurrent: document.getElementById('settingDefaultKeepCurrent').checked,
            settingMaxResults: parseInt(module.exports.parseMaxResults() || 5_000_000),
            settingDefaultPath: pathOverride ? pathOverride : defaultPath,
            settingExcludeEquipped: $('#optionsExcludeGearFrom').multipleSelect('getSelects'),
            settingDarkMode: document.getElementById('darkSlider').checked,
            settingVersion: Updater.getCurrentVersion(),
            settingBackgroundColor: document.getElementById('backgroundColorPicker').value,
            settingTextColorPicker: document.getElementById('textColorPicker').value,
            settingAccentColorPicker: document.getElementById('accentColorPicker').value,
            settingInputColorPicker: document.getElementById('inputColorPicker').value,
            settingGridTextColorPicker: document.getElementById('gridTextColorPicker').value,
            settingRedColorPicker: document.getElementById('redColorPicker').value,
            settingNeutralColorPicker: document.getElementById('neutralColorPicker').value,
            settingGreenColorPicker: document.getElementById('greenColorPicker').value
        };
        defaultOptimizerSettings = {
            settingDefaultUseReforgedStats: settings.settingDefaultUseReforgedStats,
            settingDefaultUseHeroPriority: settings.settingDefaultUseHeroPriority,
            settingDefaultUseSubstatMods: settings.settingDefaultUseSubstatMods,
            settingDefaultLockedItems: settings.settingDefaultLockedItems,
            settingDefaultEquippedItems: settings.settingDefaultEquippedItems,
            settingDefaultKeepCurrent: settings.settingDefaultKeepCurrent
        }

        excludeSelects = settings.settingExcludeEquipped;

        Files.saveFile(settingsPath, JSON.stringify(settings, null, 2))
        Api.setSettings(settings);
    },
}
