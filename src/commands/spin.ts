import {
    ApplicationCommandRegistry,
    ChatInputCommand,
    Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import {
    a_clear,
    a_pattern,
    a_tetfu,
    choice,
} from "../args";
import { clean, respond_lengthy, sfinder } from "../util";
import { p_setup, p_spin } from "../parser";

export class SpinCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override async registerApplicationCommands(
        registry: ApplicationCommandRegistry
    ): Promise<void> {
        registry.registerChatInputCommand((b) =>
            b
                .setName("spin")
                .setDescription("Finds T-Spins on a given board.")
                .addStringOption((c) => a_tetfu(c))
                .addStringOption((c) => a_pattern(c))
                .addIntegerOption((c) => a_clear(c))
                .addStringOption((c) => c.setName('filter').addChoices(choice('strict'), choice('ignore-t'), choice('none')).setDescription('Filter solutions'))
                .addIntegerOption((c) => c.setName('fill_bottom').setDescription('The bottom row in which lines should be cleared'))
                .addIntegerOption((c) => c.setName('fill_top').setDescription('The top row in which lines should be cleared'))
                .addIntegerOption((c) => c.setName('margin_height').setDescription('The range around `fill_bottom` and `fill_top` to consider for line clears'))
                .addIntegerOption((c) => c.setName('max_roof').setDescription('The maximum amount of pieces used in the overhang for a spin'))
                .addBooleanOption((c) => c.setName('roof').setDescription('Whether to require overhangs for spins'))
                .addBooleanOption((c) => c.setName('verbose').setDescription('Whether to show extended output'))
                .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        );
    }

    public override async chatInputRun(
        interaction: ChatInputCommandInteraction,
        context: ChatInputCommand.RunContext
    ): Promise<void> {
        await interaction.deferReply();

        const tetfu = interaction.options.getString("tetfu", true);
        const pattern = interaction.options.getString("pattern", true);
        const clear = interaction.options.getInteger("clear");
        const filter = interaction.options.getString("filter");
        const fill_bottom = interaction.options.getInteger("fill_bottom");
        const fill_top = interaction.options.getInteger("fill_top");
        const margin_height = interaction.options.getInteger("margin_height");
        const max_roof = interaction.options.getInteger("max_roof");
        const roof = interaction.options.getBoolean("roof");
        const verbose = interaction.options.getBoolean("verbose");

        const command = `spin -t ${tetfu} -p ${pattern} ${clear ? `-c ${clear}` : ''} ${filter ? `-f ${filter}` : ''} ${fill_bottom ? `-fb ${fill_bottom}` : ''} ${fill_top ? `-ft ${fill_top}` : ''} ${margin_height ? `-m ${margin_height}` : ''} ${max_roof ? `-mr ${max_roof}` : ''} ${roof ? `-r` : ''} -fo csv`;

        const result = await sfinder(interaction, command);

        if (result.ok) {
            const t = await p_spin(interaction, verbose || false);
            await interaction.editReply(respond_lengthy("", t, false));
        } else {
            await interaction.editReply(respond_lengthy(":warning:", result.text));
        }

        await clean(interaction);
    }
}
