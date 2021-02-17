import nodePlop, { ActionType } from 'node-plop';
import shell from 'shelljs';
import _ from 'lodash';

const plop = nodePlop('utils/plop-templates/plopfile.hbs');

interface Answers {
  componentName: string;
  description: string;
}

async function createPackage() {
  plop.setHelper('capitalize', (text) => {
    return _.capitalize(_.camelCase(text));
  });

  plop.setGenerator('component', {
    description: 'Generates a component package',
    prompts: [
      {
        type: 'input',
        name: 'componentName',
        message: 'Enter component name (lowercased):',
      },
      {
        type: 'input',
        name: 'description',
        message: 'The description of this component:',
      },
    ],
    actions(answers: any) {
      const actions: ActionType[] = [];

      if (!answers) return actions;

      const { componentName, description } = answers as Answers;

      actions.push({
        type: 'addMany',
        templateFiles: 'component/**',
        destination: '../../packages/{{dashCase componentName}}',
        base: 'component/',
        data: { description, componentName },
        abortOnFail: true,
      });

      return actions;
    },
  });

  const { runPrompts, runActions } = plop.getGenerator('component');

  const answers = await runPrompts();
  await runActions(answers);
}

async function run() {
  await createPackage();
  shell.exec('yarn');
}

run();
