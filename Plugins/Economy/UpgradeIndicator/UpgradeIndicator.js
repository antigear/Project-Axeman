﻿/******************************************************************************
 * FieldUpgradeIndicator.js
 * 
 * Author:
 * 		Aleksandar Toplek
 * 
 * Collaborators:
 * 		Grzegorz Witczak
 *
 * Created on:
 * 		11.07.2012.
 *
 *****************************************************************************/


function UpgradeIndicator() {
	/// <summary>
	/// Initializes object 
	/// </summary>
	this.Register = function () {
		// TODO Refactor
		// TODO Log

		Log("UpgradeIndicator: Registering UpgradeIndicator plugin...");

		if (MatchPages([Enums.TravianPages.VillageOut])) fieldUpgradeIndicator();
		if (MatchPages([Enums.TravianPages.VillageIn])) buildingUpgradeIndicator();

		$("head").append(CreateStylesheet("Plugins/Economy/UpgradeIndicator/UpgradeIndicatorStyle.css"));
		
		if (!IsDevelopmentMode) {
			// Google analytics
			var _gaq = _gaq || [];
			_gaq.push(['_setAccount', 'UA-33221456-3']);
			_gaq.push(['_trackEvent', 'Plugin', 'Economy/UpgradeIndicator']);

			(function () {
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				ga.src = 'https://ssl.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			})();
		}
	};
	

	function fieldUpgradeIndicator() {
		// TODO Simplify - Nesting too deep

		// Get village levels map
		var villageMap = $("#village_map");
		var villageType = ActiveProfile.Villages[ActiveVillageIndex].VillageOut.Type;
		var availableFields = Enums.VillageOutMaps[villageType];
		$(".level", villageMap).each(function (levelIndex, levelObject) {
			if (!$(this).is(".underConstruction")) {
				var processed = false;

				// Get current field level
				var fieldLevel = parseInt($(this).text(), 10) || 0;

				// Go through all available resource tyoes
				for (var rIndex = 0, cache = availableFields.length; rIndex < cache; rIndex++) {
					// Go through all available fields for specific resource type
					for (var fIndex = 0, cache = availableFields[rIndex].length; fIndex < cache; fIndex++) {
						if (levelIndex == availableFields[rIndex][fIndex]) {
							// If we found filed type, we can retrieve cost from Enums.Fields
							var fieldUpgradeCost = Enums.Fields[rIndex][fieldLevel];

							var upgradeState = "Upgradeable";
							var maxFieldLvl = ActiveProfile.Villages[ActiveVillageIndex].IsMainCity ? 20 : 10;
							if(fieldLevel < maxFieldLvl){
								for (var rrIndex = 0; rrIndex < 4; rrIndex++) {
									// Check if village have warehouse/granary large enough to upgrade field
									var canStoreResource = ActiveProfile.Villages[ActiveVillageIndex].Resources.Storage[rrIndex];
									if (fieldUpgradeCost[rrIndex] > canStoreResource) {
										upgradeState = "NonUpgradeable";
										break;
									}
									else {
										// Check if enough resources is stored to allow upgrade
										var availableResource = ActiveProfile.Villages[ActiveVillageIndex].Resources.Stored[rrIndex];
										var costDiff = availableResource - fieldUpgradeCost[rrIndex];
										if (costDiff < 0) {
											upgradeState = "NoResources";
											// NOTE: This can't break because we have to check for
											// warehouse/granary cost difference even if we can't
											// upgrade field. Can be case where we can't upgarade
											// because of wood and we would break at first itteration
											// but field clay cost is larger than what can be store. 
										}
									}

									DLog("Storage: " + canStoreResource + " Cost[" + rrIndex + "]: " + fieldUpgradeCost[rrIndex] + " for lvl." + (fieldLevel + 1));
								}
							}
							else{
								upgradeState = "MaxUpgraded";
							}
							processed = true;
							break;
						}
					}

					if (processed) break;
				}
			}
			else {
				upgradeState = "UnderConstruction";
			}
			
			// Apply styles
			$(levelObject).addClass("PAUIElement");
			$(levelObject).addClass(upgradeState);
		});
	}

	function buildingUpgradeIndicator() {
		// TODO Simplify - Nesting too deep

		// Get village levels map
		var villageMap = $("#village_map");
		var GIDs = Enums.VillageInGID;
		var buildings = $("img", villageMap).not(".iso, .clickareas, #lswitch, .onTop");
		buildings.each(function (index) {
			var levelObject = $("#levels div", villageMap)[index];
			if (!$(levelObject).is(".underConstruction")) {
				// Get current building level and GID
				// TODO Pull this from profile.village model
				var buildingLevel = parseInt($(levelObject).text(), 10) || 0;
				var buildingGID = $(this).attr("class").match(/g([0-9]{1,2})/)[1];
				var building = Enums.Buildings[GIDs[buildingGID]];
				var buildingUpgradeCost = building[buildingLevel];

				DLog("------" + buildingGID + ": " + GIDs[buildingGID]);

				var upgradeState = "Upgradeable";
				if (buildingLevel < building.length) {
					for (var rrIndex = 0; rrIndex < 4; rrIndex++) {
						// Check if village have warehouse/granary large enough to upgrade field
						var canStoreResource = ActiveProfile.Villages[ActiveVillageIndex].Resources.Storage[rrIndex];

						if (buildingUpgradeCost[rrIndex] > canStoreResource) {
							upgradeState = "NonUpgradeable";
							break;
						}
						else {
							// Check if enough resources is stored to allow upgrade
							var availableResource = ActiveProfile.Villages[ActiveVillageIndex].Resources.Stored[rrIndex];
							var costDiff = availableResource - buildingUpgradeCost[rrIndex];
							if (costDiff < 0) {
								upgradeState = "NoResources";
								// NOTE: This can't break because we have to check for
								// warehouse/granary cost difference even if we can't
								// upgrade field. Can be case where we can't upgarade
								// because of wood and we would break at first itteration
								// but field clay cost is larger than what can be store. 
							}
						}

						DLog("Storage: " + canStoreResource + " Cost[" + rrIndex + "]: " + buildingUpgradeCost[rrIndex] + " for lvl." + (buildingLevel + 1));
					}
				}
				else {
					upgradeState = "MaxUpgraded";
				}
			}
			else {
				upgradeState = "UnderConstruction";
			}
			
			// Apply styles
			$(levelObject).addClass("PAUIElement");
			$(levelObject).addClass(upgradeState);
		});
	}
};

// Metadata for this plugin (UpgradeIndicator)
var UpgradeIndicatorMetadata = {
	Name: "UpgradeIndicator",
	Alias: "Upgrade Indicator",
	Category: "Economy",
	Version: "0.2.0.8",
	Description: "Know when you can upgrade fields and building without clicking for each. This plugin will highlight upgradeable fields and buildings for you.",
	Author: "JustBuild Development",
	Site: "https://github.com/JustBuild/Project-Axeman/wiki",

	Settings: {
		RunOnPages: [Enums.TravianPages.VillageIn, Enums.TravianPages.VillageOut],
		IsLoginRequired: true
	},

	Flags: {
		Beta: true
	},

	Class: UpgradeIndicator
};

// Adds this plugin to global list of available plugins
GlobalPluginsList[GlobalPluginsList.length] = $.extend(true, {}, Models.PluginMetadata, UpgradeIndicatorMetadata);
