import {copyFile, readFile, writeFile} from 'fs/promises'
import {resolve} from 'path'
import {spawn} from 'child_process'

const projectName = process.argv[2]

const DYN_PROVIDERS = 'dyn_providers'
const DYN_INJECTOR = 'dyn_injector'
const DYN_INPUT = 'dyn_input'
const SELF_VS_HOST = 'self_vs_host'
const DIRECTIVES = 'directives'
const RXJS = 'rxjs'
const FORWARD_REF = 'forward_ref'
const CVA = 'cva'
const NGRX_VS_SIGNAL = 'ngrx_vs_signal'

const INIT_APP = resolve('init-files/app.ts')
const INIT_APP_CONFIG = resolve('init-files/app.config.ts')
const INIT_MAIN = resolve('init-files/main.ts')
const INIT_TSCONFIG = resolve('init-files/tsconfig.app.json')
const INIT_PACKAGE = resolve('init-files/package.json')

const FILE_APP = resolve('src/app/app.ts')
const FILE_APP_CONFIG = resolve('src/app/app.config.ts')
const FILE_MAIN = resolve('src/main.ts')
const FILE_TSCONFIG = resolve('tsconfig.app.json')
const FILE_PACKAGE = resolve('package.json')

async function replaceString(filePath, searchString, replaceContent) {
    try {
        let fileContent = await readFile(filePath, 'utf-8')
        const escapedSearchString = searchString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(escapedSearchString, 'g')
        if (!fileContent.includes(searchString)) {
            console.warn(`Warning: Search string "${searchString}" not found. File not modified.`)
            return;
        }
        fileContent = fileContent.replace(regex, replaceContent)
        await writeFile(filePath, fileContent, 'utf-8')
        console.log(`Successfully replace line: \n ${replaceContent}`)
    } catch (error) {
        console.error('An error occurred during file operation:', error)
    }
}

// reset all files to initial state
const resetProject = async () => {
    await copyFile(INIT_APP, FILE_APP)
    await copyFile(INIT_APP_CONFIG, FILE_APP_CONFIG)
    await copyFile(INIT_MAIN, FILE_MAIN)
    await copyFile(INIT_TSCONFIG, FILE_TSCONFIG)
    await copyFile(INIT_PACKAGE, FILE_PACKAGE)
}

const npmInstall = async () => new Promise((resolve, reject) => {
    const child = spawn('npm', ['install'])
    child.stdout.on('data', (data) => {
        process.stdout.write(data.toString())
    })
    child.stderr.on('data', (data) => {
        process.stderr.write(data.toString())
    });
    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`\nProcess exited with code ${code}`)
            reject(code)
        } else {
            console.log(`\nProcess exited successfully.`);
            resolve()
        }
    })
    child.on('error', (err) => {
        console.error(`Failed to start subprocess: ${err.message}`);
    })
})

const replaceInFile = (filePath, searchString) => {
    return async (replaceContent) => {
        replaceContent = searchString + replaceContent
        await replaceString(filePath, searchString, replaceContent)
    }
}

const tsconfigInclude = replaceInFile(resolve('tsconfig.app.json'), '"include": [')
const appTemplate = replaceInFile(FILE_APP, 'template: `')
const appImports = replaceInFile(FILE_APP, 'imports: [')
const appImportFrom = replaceInFile(FILE_APP, 'from \'@angular/core\'')
const mainBootstrap = replaceInFile(FILE_MAIN, 'bootstrapApplication(App, appConfig)')
const mainImportFrom = replaceInFile(FILE_MAIN, 'from \'./app/app\'')
const appConfigProviders = replaceInFile(FILE_APP_CONFIG, 'provideZonelessChangeDetection()')
const appConfigImportFrom = replaceInFile(FILE_APP_CONFIG, 'from \'@angular/core\'')
const packageAdd = replaceInFile(FILE_PACKAGE, '"tslib": "^2.3.0"')

const dynProviderProject = async () => {
    await tsconfigInclude(`\n    "src/**/dynamic.providers.ts",`)
    await appTemplate('<ia-widget-container></ia-widget-container>')
    await appImports('WidgetContainerComponent')
    await appImportFrom('\nimport { WidgetContainerComponent } from \'@ia/dynamic.providers\'')
}

const dynInjectorProject = async () => {
    await tsconfigInclude(`\n    "src/**/dynamic.injector.ts",`)
    await appTemplate('<ia-injector-container></ia-injector-container>')
    await appImports('InjectorContainerComponent')
    await appImportFrom('\nimport { InjectorContainerComponent } from \'@ia/dynamic-injector\'')

    await mainBootstrap('\n    .then((app) => setAppInjector(app.injector))')
    await mainImportFrom('\nimport { setAppInjector } from \'@ia/dynamic-injector\'')
}

const dynInputProject = async () => {
    await tsconfigInclude(`\n    "src/**/dynamic.input.ts",`)
    await appTemplate('<ia-dyn-input></ia-dyn-input>')
    await appImports('DynInputComponent')
    await appImportFrom('\nimport { DynInputComponent } from \'@ia/dynamic-input\'')
}

const selfHostProject = async () => {
    await tsconfigInclude(`\n    "src/**/self-vs-host.ts",`)
    await appTemplate('<ia-self-host-container></ia-self-host-container>')
    await appImports('SelfHostContainerComponent')
    await appImportFrom('\nimport { SelfHostContainerComponent } from \'@ia/self-vs-host\'')
}

const directivesProject = async () => {
    await tsconfigInclude(`\n    "src/**/directives.ts",`)
    await appTemplate('<ia-directives-container></ia-directives-container>')
    await appImports('DirectivesContainerComponent')
    await appImportFrom('\nimport { DirectivesContainerComponent } from \'@ia/directives\'')
}

const rxjsProject = async () => {
    await tsconfigInclude(`\n    "src/**/rxjs.ts",`)
    await appTemplate('<ia-rxjs-container></ia-rxjs-container>')
    await appImports('RxjsContainerComponent')
    await appImportFrom('\nimport { RxjsContainerComponent } from \'@ia/rxjs\'')
}

const forwardRefProject = async () => {
    await tsconfigInclude(`\n    "src/**/forward-ref.ts",`)
    await appTemplate('<ia-parent></ia-parent>')
    await appImports('ParentComponent')
    await appImportFrom('\nimport { ParentComponent } from \'@ia/forward-ref\'')
}

const cvaProject = async () => {
    await tsconfigInclude(`\n    "src/**/cva.ts",`)
    await appTemplate('<ia-cva-container></ia-cva-container>')
    await appImports('CvaContainerComponent')
    await appImportFrom('\nimport { CvaContainerComponent } from \'@ia/cva\'')
}

const ngrxSignalProject = async () => {
    await tsconfigInclude(`\n    "src/**/ngrx-vs-signal.ts",`)
    await appTemplate('<ia-ngrx-signal></ia-ngrx-signal>')
    await appImports('NgrxSignalComponent')
    await appImportFrom('\nimport { NgrxSignalComponent } from \'@ia/ngrx-vs-signal\'')

    await packageAdd(',\n    "@ngrx/store": "^20.1.0"')
    await appConfigProviders(',\n        provideStore({itemsState: itemsReducer})')
    await appConfigImportFrom('\nimport { itemsReducer } from \'@ia/ngrx-vs-signal\'')
    await appConfigImportFrom('\nimport { provideStore } from \'@ngrx/store\'')
}

await resetProject()

switch (projectName) {
    case DYN_PROVIDERS:
        await dynProviderProject()
        break
    case DYN_INJECTOR:
        await dynInjectorProject()
        break
    case DYN_INPUT:
        await dynInputProject()
        break
    case SELF_VS_HOST:
        await selfHostProject()
        break
    case DIRECTIVES:
        await directivesProject()
        break
    case RXJS:
        await rxjsProject()
        break
    case FORWARD_REF:
        await forwardRefProject()
        break
    case CVA:
        await cvaProject()
        break
    case NGRX_VS_SIGNAL:
        await ngrxSignalProject()
        break

    default:
        console.warn(`
Syntax: node projects [project-name]
Example: node projects ${DIRECTIVES}
project-name:
  ${DYN_PROVIDERS}
  ${DYN_INJECTOR}
  ${DYN_INPUT}
  ${SELF_VS_HOST}
  ${DIRECTIVES}
  ${RXJS}
  ${FORWARD_REF}
  ${CVA}
  ${NGRX_VS_SIGNAL}
`)
}

await npmInstall()
