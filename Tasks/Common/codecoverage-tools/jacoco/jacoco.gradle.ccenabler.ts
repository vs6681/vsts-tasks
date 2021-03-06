/// <reference path="../../../../definitions/Q.d.ts" />
/// <reference path="../../../../definitions/string.d.ts" />
/// <reference path="../../../../definitions/vsts-task-lib.d.ts" />
/// <reference path="../../../../definitions/node.d.ts" />

import * as util from "../utilities";
import * as tl from "vsts-task-lib/task";
import * as ccc from "../codecoverageconstants";
import * as cc from "../codecoverageenabler";
import * as str from "string";
import * as Q from "q";

export class JacocoGradleCodeCoverageEnabler extends cc.JacocoCodeCoverageEnabler {
    // -----------------------------------------------------
    // Enable code coverage for Jacoco Gradle Builds
    // - enableCodeCoverage: CodeCoverageProperties  - ccProps
    // -----------------------------------------------------    
    public enableCodeCoverage(ccProps: { [name: string]: string }): Q.Promise<boolean> {
        let _this = this;

        tl.debug("Input parameters: " + JSON.stringify(ccProps));

        _this.buildFile = ccProps["buildfile"];
        let classFilter = ccProps["classfilter"];
        let isMultiModule = ccProps["ismultimodule"] && ccProps["ismultimodule"] === "true";
        let classFileDirs = ccProps["classfilesdirectories"];
        let reportDir = ccProps["reportdirectory"];
        let codeCoveragePluginData = null;

        let filter = _this.extractFilters(classFilter);
        let jacocoExclude = _this.applyFilterPattern(filter.excludeFilter);
        let jacocoInclude = _this.applyFilterPattern(filter.includeFilter);

        if (isMultiModule) {
            codeCoveragePluginData = ccc.jacocoGradleMultiModuleEnable(jacocoExclude.join(","), jacocoInclude.join(","), classFileDirs, reportDir);
        } else {
            codeCoveragePluginData = ccc.jacocoGradleSingleModuleEnable(jacocoExclude.join(","), jacocoInclude.join(","), classFileDirs, reportDir);
        }

        try {
            tl.debug("Code Coverage data will be appeneded to build file: " + this.buildFile);
            util.appendTextToFileSync(this.buildFile, codeCoveragePluginData);
            tl.debug("Appended code coverage data");
        } catch (error) {
            tl.warning(tl.loc("FailedToAppendCC", error));
            return Q.reject<boolean>(tl.loc("FailedToAppendCC", error));
        }
        return Q.resolve<boolean>(true);
    }

    protected applyFilterPattern(filter: string): string[] {
        let ccfilter = [];

        if (!util.isNullOrWhitespace(filter)) {
            str(util.trimToEmptyString(filter)).replaceAll(".", "/").s.split(":").forEach(exFilter => {
                if (exFilter) {
                    ccfilter.push(str(exFilter).endsWith("*") ? ("'" + exFilter + "/**'") : ("'" + exFilter + ".class'"));
                }
            });
        }

        tl.debug("Applying the filter pattern: " + filter + " op: " + ccfilter);
        return ccfilter;
    }
}
