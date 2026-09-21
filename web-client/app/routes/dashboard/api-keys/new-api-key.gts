import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

interface Signature {
  Args: {
    name: string;
    token: string;
  };
}

/**
 * Shown exactly once, right after creating a key — the secret cannot
 * be retrieved again afterwards.
 */
export default class NewApiKey extends Component<Signature> {
  @tracked copied = false;

  copy = async () => {
    await navigator.clipboard.writeText(this.args.token);
    this.copied = true;
  };

  <template>
    <div class="new-key" role="status">
      <p><strong>{{@name}}</strong> was created. This is the only time the key is
        shown — store it somewhere safe.</p>

      <p class="token-row">
        <code>{{@token}}</code>
        <button type="button" {{on "click" this.copy}}>
          {{if this.copied "Copied!" "Copy"}}
        </button>
      </p>
    </div>

    <style scoped>
      .new-key {
        border: var(--border-width) var(--border-style) var(--color-success, green);
        border-radius: var(--radius);
        padding: var(--padding-3);
        margin-bottom: var(--gap-3);
      }

      .new-key p {
        margin: 0 0 var(--gap-2);
      }

      .token-row {
        display: flex;
        align-items: center;
        gap: var(--gap-2);
      }

      .token-row code {
        overflow-wrap: anywhere;
        user-select: all;
      }

      .token-row button {
        flex-shrink: 0;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        background: none;
        color: var(--color-text);
        padding: var(--padding-1) var(--padding-2);
        cursor: pointer;
      }
    </style>
  </template>
}
