namespace OneBear.Application.Common.Interfaces;

public interface ITypingTracker
{
    void Track(string userId, string roomId, bool isTyping);
}
