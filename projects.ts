import { copyFile, readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { spawn } from 'child_process'

const projectName = process.argv[2]

const DYNAMIC_PROVIDERS = 'dynamic-providers'
const DYNAMIC_INJECTOR = 'dynamic-injector'
const DYNAMIC_INPUT = 'dynamic-input'
const SELF_VS_HOST = 'self-vs-host'
const DIRECTIVES = 'directives'
const PIPES = 'pipes'
const ROUTES = 'routes'
const RXJS = 'rxjs'
const CVA = 'cva'
const NGRX_VS_SIGNAL = 'ngrx-vs-signal'
const ZONELESS = 'zoneless'
const LIFECYCLE = 'lifecycle'
const INTERACTION = 'interaction'
const DI = 'di'

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

async function replaceString(filePath: string, searchString: string, replaceContent: string) {
    try {
        let fileContent = await readFile(filePath, 'utf-8')
        const escapedSearchString = searchString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(escapedSearchString, 'g')
        if (!fileContent.includes(searchString)) {
            console.warn(`Warning: Search string "${searchString}" not found. File not modified.`)
            return
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

const npmInstall = async (cmd: string[]) => new Promise((resolve, reject) => {
    const child = spawn('npm', cmd)
    child.stdout.on('data', (data) => {
        process.stdout.write(data.toString())
    })
    child.stderr.on('data', (data) => {
        process.stderr.write(data.toString())
    })
    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`\nProcess exited with code ${code}`)
            reject(code)
        } else {
            console.log(`\nProcess exited successfully.`)
            resolve(1)
        }
    })
    child.on('error', (err) => {
        console.error(`Failed to start subprocess: ${err.message}`)
    })
})

const replaceInFile = (filePath: string, searchString: string) => {
    return async (replaceContent: string) => {
        replaceContent = searchString + replaceContent
        await replaceString(filePath, searchString, replaceContent)
    }
}

const tsconfigInclude = replaceInFile(resolve('tsconfig.app.json'), '"include": [')
const appTemplate = replaceInFile(FILE_APP, 'template: `')
const appImportsArr = replaceInFile(FILE_APP, 'imports: [')
const appImportFrom = replaceInFile(FILE_APP, 'from \'@angular/core\'')
const mainBootstrap = replaceInFile(FILE_MAIN, 'bootstrapApplication(App, appConfig)')
const mainImportFrom = replaceInFile(FILE_MAIN, 'from \'./app/app\'')
const appConfigProviders = replaceInFile(FILE_APP_CONFIG, 'provideZonelessChangeDetection()')
const appConfigImportFrom = replaceInFile(FILE_APP_CONFIG, 'from \'@angular/core\'')


const dynamicProvidersProject = async () => {
    await tsconfigInclude(`\n    "src/**/dynamic-providers.ts",`)
    await appTemplate('<ia-widget-container></ia-widget-container>')
    await appImportsArr('WidgetContainerComponent')
    await appImportFrom('\nimport { WidgetContainerComponent } from \'@ia/dynamic-providers\'')
}

const dynamicInjectorProject = async () => {
    await tsconfigInclude(`\n    "src/**/dynamic-injector.ts",`)
    await appTemplate('<ia-injector-container></ia-injector-container>')
    await appImportsArr('InjectorContainerComponent')
    await appImportFrom('\nimport { InjectorContainerComponent } from \'@ia/dynamic-injector\'')

    await mainBootstrap('\n    .then((app) => setAppInjector(app.injector))')
    await mainImportFrom('\nimport { setAppInjector } from \'@ia/dynamic-injector\'')
}

const dynInputProject = async () => {
    await tsconfigInclude(`\n    "src/**/dynamic.input.ts",`)
    await appTemplate('<ia-dyn-input></ia-dyn-input>')
    await appImportsArr('DynInputComponent')
    await appImportFrom('\nimport { DynInputComponent } from \'@ia/dynamic-input\'')
}

const selfHostProject = async () => {
    await tsconfigInclude(`\n    "src/**/self-vs-host.ts",`)
    await appTemplate('<ia-self-host-container></ia-self-host-container>')
    await appImportsArr('SelfHostContainerComponent')
    await appImportFrom('\nimport { SelfHostContainerComponent } from \'@ia/self-vs-host\'')
}

const directivesProject = async () => {
    await tsconfigInclude(`\n    "src/**/directives.ts",`)
    await appTemplate('<ia-directives-container></ia-directives-container>')
    await appImportsArr('DirectivesContainerComponent')
    await appImportFrom('\nimport { DirectivesContainerComponent } from \'@ia/directives\'')
}

const pipesProject = async () => {
    await tsconfigInclude(`\n    "src/**/pipes.ts",`)
    await appTemplate('<ia-pipes-container></ia-pipes-container>')
    await appImportsArr('PipesContainerComponent')
    await appImportFrom('\nimport { PipesContainerComponent } from \'@ia/pipes\'')
}

const routesProject = async () => {
    await tsconfigInclude(`\n    "src/**/routes.ts",`)
    await appTemplate('<ia-routes-container></ia-routes-container>')
    await appImportsArr('RoutesContainerComponent')
    await appImportFrom('\nimport { RoutesContainerComponent } from \'@ia/routes\'')

    await appConfigProviders(',\n        provideRouter(routes)')
    await appConfigImportFrom('\nimport { routes } from \'@ia/routes\'')
    await appConfigImportFrom('\nimport { provideRouter } from \'@angular/router\'')
}

const rxjsProject = async () => {
    await tsconfigInclude(`\n    "src/**/rxjs.ts",`)
    await appTemplate('<ia-rxjs-container></ia-rxjs-container>')
    await appImportsArr('RxjsContainerComponent')
    await appImportFrom('\nimport { RxjsContainerComponent } from \'@ia/rxjs\'')
}

const cvaProject = async () => {
    await tsconfigInclude(`\n    "src/**/cva.ts",`)
    await appTemplate('<ia-cva-container></ia-cva-container>')
    await appImportsArr('CvaContainerComponent')
    await appImportFrom('\nimport { CvaContainerComponent } from \'@ia/cva\'')
}

const ngrxSignalProject = async () => {
    await npmInstall(['install', '--legacy-peer-deps', '@ngrx/store'])

    await tsconfigInclude(`\n    "src/**/ngrx-vs-signal.ts",`)
    await appTemplate('<ia-ngrx-signal></ia-ngrx-signal>')
    await appImportsArr('NgrxSignalComponent')
    await appImportFrom('\nimport { NgrxSignalComponent } from \'@ia/ngrx-vs-signal\'')

    await appConfigProviders(',\n        provideStore({itemsState: itemsReducer})')
    await appConfigImportFrom('\nimport { itemsReducer } from \'@ia/ngrx-vs-signal\'')
    await appConfigImportFrom('\nimport { provideStore } from \'@ngrx/store\'')
}

const zoneLessProject = async () => {
    await tsconfigInclude(`\n    "src/**/zoneless.ts",`)
    await appTemplate('<ia-zoneless-container></ia-zoneless-container>')
    await appImportsArr('ZoneLessContainerComponent')
    await appImportFrom('\nimport { ZoneLessContainerComponent } from \'@ia/zoneless\'')
}

const lifecycleProject = async () => {
    await tsconfigInclude(`\n    "src/**/lifecycle.ts",`)
    await appTemplate('<ia-lifecycle-hooks-container></ia-lifecycle-hooks-container>')
    await appImportsArr('LifecycleHooksContainerComponent')
    await appImportFrom('\nimport { LifecycleHooksContainerComponent } from \'@ia/lifecycle\'')
}

const interactionProject = async () => {
    await tsconfigInclude(`\n    "src/**/component-interaction.ts",`)
    await appTemplate('<ia-interaction-container></ia-interaction-container>')
    await appImportsArr('InteractionContainerComponent')
    await appImportFrom('\nimport { InteractionContainerComponent } from \'@ia/component-interaction\'')
}

const diProject = async () => {
    await tsconfigInclude(`\n    "src/**/di.ts",`)
    await appTemplate('<ia-di-container></ia-di-container>')
    await appImportsArr('DiContainerComponent')
    await appImportFrom('\nimport { DiContainerComponent } from \'@ia/di\'')
}

await resetProject()

switch (projectName) {
    case DYNAMIC_PROVIDERS:
        await dynamicProvidersProject()
        break
    case DYNAMIC_INJECTOR:
        await dynamicInjectorProject()
        break
    case DYNAMIC_INPUT:
        await dynInputProject()
        break
    case SELF_VS_HOST:
        await selfHostProject()
        break
    case DIRECTIVES:
        await directivesProject()
        break
    case PIPES:
        await pipesProject()
        break
    case ROUTES:
        await routesProject()
        break
    case RXJS:
        await rxjsProject()
        break
    case CVA:
        await cvaProject()
        break
    case NGRX_VS_SIGNAL:
        await ngrxSignalProject()
        break
    case ZONELESS:
        await zoneLessProject()
        break
    case LIFECYCLE:
        await lifecycleProject()
        break
    case INTERACTION:
        await interactionProject()
        break
    case DI:
        await diProject()
        break
    default:
        console.warn(`
Syntax: node projects [project-name]
Example: node projects ${DIRECTIVES}
project-name:
  ${DYNAMIC_PROVIDERS}
  ${DYNAMIC_INJECTOR}
  ${DYNAMIC_INPUT}
  ${SELF_VS_HOST}
  ${DIRECTIVES}
  ${PIPES}
  ${ROUTES}
  ${RXJS}
  ${CVA}
  ${NGRX_VS_SIGNAL}
  ${ZONELESS}
  ${LIFECYCLE}
  ${INTERACTION}
  ${DI}
`)
}

await npmInstall(['install'])
