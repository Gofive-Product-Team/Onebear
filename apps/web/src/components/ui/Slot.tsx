import {
	Children,
	cloneElement,
	forwardRef,
	isValidElement,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
} from 'react'

interface Props extends HTMLAttributes<HTMLElement> {
	children: ReactNode
}

export const Slot = forwardRef<HTMLElement, Props>(function Slot({ children, ...props }, ref) {
	const child = Children.only(children)

	if (!isValidElement(child)) {
		return null
	}

	const childProps = child.props as Record<string, unknown>

	return cloneElement(
		child,
		{
			...props,
			...childProps,
			ref: ref as Ref<never>,
			className: [props.className, childProps.className].filter(Boolean).join(' '),
		} as Record<string, unknown>,
	)
})
