import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";

// Global variable to store the HRE for tests
let hre: HardhatRuntimeEnvironment;

export function useEnvironment(fixtureProjectName: string): HardhatRuntimeEnvironment {
  beforeEach(() => {
    process.chdir(path.join(__dirname, "fixture-projects", fixtureProjectName));

    hre = require("hardhat");
  });

  afterEach(() => {
    resetHardhatContext();
  });

  return hre;
}

export function getHre(): HardhatRuntimeEnvironment {
  return hre;
}
