import {
  ApplicationCommandRegistry,
  ChatInputCommand,
  Command,
  ContextMenuCommand,
} from "@sapphire/framework";
import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
} from "discord.js";
import { render } from "../util";

export class RenderCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerContextMenuCommand((b) =>
      b.setName("Render Fumen").setType(ApplicationCommandType.Message)
    );
    registry.registerChatInputCommand((b) =>
      b
        .setName("render")
        .setDescription("Renders a fumen.")
        .addStringOption((t) =>
          t
            .setName("fumen")
            .setDescription("The fumen to render")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<void> {
    const content = interaction.options.getString("fumen", true);
    await render(content, interaction.reply.bind(interaction));
  }

  public override async contextMenuRun(
    interaction: ContextMenuCommandInteraction,
    context: ContextMenuCommand.RunContext
  ): Promise<void> {
    if (interaction.isMessageContextMenuCommand()) {
      const content = interaction.targetMessage.content;
      await render(content, interaction.reply.bind(interaction));
    }
  }
}
