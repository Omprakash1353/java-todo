import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface HintProps {
	label: string;
	children: React.ReactNode;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
}

export const Hint = ({ label, children, side = "top", align = "center" }: HintProps) => {
	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent side={side} align={align} className="bg-popover text-popover-foreground">
					<p className="text-xs font-medium">{label}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
