import { Page } from '@webformula/core';
import { mdwDialog } from '@webformula/material';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Dialogs';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  async openSimple() {
    const answer = await mdwDialog.simple({
      headline: 'Question',
      message: 'Are you sure?',
      actionCancel: true
    });

    if (answer === 'confirm') console.log('User pressed ok');
    if (answer === 'cancel') console.log('User pressed cancel');
  }

  openTemplate() {
    mdwDialog.template({
      template: `
      <div class="mdw-header">Headline</div>
      <div class="mdw-content">Here is some content for the dialog.</div>
      <div class="mdw-actions">
        <mdw-button onclick="mdwDialog.close()">Close</mdw-button>
      </div>
      `
    });
  }

  openFullscreen() {
    mdwDialog.template({
      template: `
        <div class="mdw-header">
          <mdw-icon onclick="mdwDialog.close()">close</mdw-icon>
          <div class="mdw-headline">Headline</div>
          <mdw-button>Save</mdw-button>
        </div>
        <div class="mdw-content">
          <mdw-text-field style="width: 100%">
            <input>
            <label>First name</label>
          </mdw-text-field>
          <mdw-text-field style="width: 100%">
            <input>
            <label>Last name</label>
          </mdw-text-field>
      
          <div class="mdw-supporting-text">
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin
            literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
            College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
            going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes
            from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero,
            written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first
            line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
      
            The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32
            and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form,
            accompanied by English versions from the 1914 translation by H. Rackham.
          </div>

          <div class="mdw-supporting-text">
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin
            literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
            College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
            going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes
            from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero,
            written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first
            line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
      
            The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32
            and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form,
            accompanied by English versions from the 1914 translation by H. Rackham.
          </div>

          <div class="mdw-supporting-text">
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin
            literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
            College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
            going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes
            from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero,
            written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first
            line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
      
            The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32
            and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form,
            accompanied by English versions from the 1914 translation by H. Rackham.
          </div>

          <div class="mdw-supporting-text">
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin
            literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
            College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
            going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes
            from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero,
            written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first
            line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
      
            The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32
            and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form,
            accompanied by English versions from the 1914 translation by H. Rackham.
          </div>

          <div class="mdw-actions">
        <mdw-button onclick="mdwDialog.close('response value')">Close</mdw-button>
      </div>
        </div>
      `
    });
  }

  async openTemplate() {
    const value = await mdwDialog.template({
      template: `
      <div class="mdw-header">Headline</div>
      <div class="mdw-content">Here is some content for the dialog.</div>
      <div class="mdw-actions">
        <mdw-button onclick="mdwDialog.close('response value')">Close</mdw-button>
      </div>
      `
    });

    console.log(value);
  }
}
