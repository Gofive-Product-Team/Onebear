namespace OneBear.Domain.Enums;

public static class MessageType
{
    public const string Text = "Text";
    public const string Image = "Image";
    public const string Video = "Video";
    public const string Audio = "Audio";
    public const string File = "File";
    public const string Sticker = "Sticker";
    public const string Location = "Location";
    public const string System = "System";
    public const string TemplateMessage = "TemplateMessage";
    public const string Carousel = "Carousel";
    public const string ReactionAdded = "ReactionAdded";
    public const string ReactionRemoved = "ReactionRemoved";
    public const string Note = "Note";
    public const string EmailMessage = "Email";
    public const string Story = "Story";
    public const string Order = "Order";
    public const string Product = "Product";
    public const string Flex = "Flex";
    public const string Comment = "Comment";

    public static readonly string[] All = [Text, Image, Video, Audio, File, Sticker, Location, System,
        TemplateMessage, Carousel, ReactionAdded, ReactionRemoved, Note, EmailMessage, Story, Order, Product, Flex, Comment];
}
