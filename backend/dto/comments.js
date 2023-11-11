class CommentsDTO{
    constructor(comment)
    {
        this._id = comment._id;
        this.content = comment.content;
        this.createdAt = comment.createdAt;
        this.authorUserName = comment.author.username;
    }
};

module.exports = CommentsDTO;