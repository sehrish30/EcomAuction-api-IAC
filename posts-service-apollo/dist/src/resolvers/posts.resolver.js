"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pubsub = void 0;
const posts_mongo_1 = require("./../models/posts.mongo");
const user_mongo_1 = require("./../models/user.mongo");
const auth_1 = require("../helpers/auth");
const bson_1 = require("bson");
const graphql_subscriptions_1 = require("graphql-subscriptions");
exports.pubsub = new graphql_subscriptions_1.PubSub();
// # subscriptions
// use it as event type
// whenever POST_ADDED event happens we are going to execute
// pubsub pattern
// so we have real time subscription
// we need to use this event in post create
const POST_ADDED = "POST_ADDED";
const POST_UPDATED = "POST_UPDATED";
const POST_DELETED = "POST_DELETED";
const allPosts = async (parent, args, context) => {
    // pagination
    const currentPage = args.page || 1;
    const perPage = 3;
    return await posts_mongo_1.PostsModel.find({})
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .populate("postedBy", "username _id")
        .sort({
        createdAt: -1,
    });
};
const postsByUser = async (parent, args, context) => {
    // pagination
    const email = await (0, auth_1.authCheck)(context.token);
    const user = await user_mongo_1.UserModel.findOne({ email });
    return await posts_mongo_1.PostsModel.find({
        postedBy: user._id,
    })
        .populate("postedBy", "_id username")
        .sort({
        createdAt: -1,
    });
};
// mutation
// parent means    newPost from typeDef
// args are arguments
const postCreate = async (parent, args, context) => {
    const email = await (0, auth_1.authCheck)(context.token);
    const user = await user_mongo_1.UserModel.findOne({ email });
    //
    // validation
    if (args.input.content.trim() === "") {
        throw new Error("Content required");
    }
    const newPost = await new posts_mongo_1.PostsModel(Object.assign(Object.assign({}, args.input), { postedBy: user._id }))
        .save()
        .then((post) => post.populate("postedBy", "_id username"));
    console.log("KAIRO", exports.pubsub);
    // publish the event post added
    // server will trigger this POST_ADDED event
    // along with this data
    // so apollo client will know new post has been added
    // and we will be able to grab new post content using postAdded object
    // do anything in frontend
    // you can display a pop up that new post has been created
    // or you can make another query to your server
    // that you update the UI with latest post
    exports.pubsub.publish(POST_ADDED, {
        // send this data whenever this event is published
        postAdded: newPost,
    });
    return newPost;
};
const postUpdate = async (parent, args, context) => {
    // if same user then only update the post
    const currentUser = await (0, auth_1.authCheck)(context.token);
    // validation
    if (args.input.content.trim() === "") {
        throw new Error("Content is required");
    }
    // get current user
    const user = await user_mongo_1.UserModel.findOne({
        email: currentUser,
    });
    // if current user id and id of the post postedBy userId is same allow update
    // _id of post to update
    const postToUpdate = await posts_mongo_1.PostsModel.findOneAndUpdate({
        _id: args.input._id,
        postedBy: user._id,
    }, Object.assign({}, args.input), {
        new: true,
    }).populate("postedBy", "_id username");
    if (!postToUpdate) {
        throw new Error("Unauthorized");
    }
    // pubsub will publish this event
    // postUpdated same key so data is already in cache
    // when same data key is returned
    // it overrides the cache value
    // postUpdated is subscription name
    // if the id is returned
    // if the id is matched of the post we already
    // have in cache then this will work behind the scenes
    // and update the particular information about that particular post
    // as long as there is matching of ids
    exports.pubsub.publish(POST_UPDATED, {
        postUpdated: postToUpdate,
    });
    return postToUpdate;
};
const postDelete = async (parent, args, context) => {
    // if same user then only update the post
    const currentUser = await (0, auth_1.authCheck)(context.token);
    // get current user
    const user = await user_mongo_1.UserModel.findOne({
        email: currentUser,
    });
    console.log(args.postId, user._id);
    const postToDelete = await posts_mongo_1.PostsModel.findOneAndDelete({
        _id: new bson_1.ObjectId(args.postId),
        postedBy: user._id,
    }).populate("postedBy", "_id username");
    if (!postToDelete) {
        throw new Error("Unauthorized");
    }
    // pubsub will publish this event
    exports.pubsub.publish(POST_DELETED, {
        postDeleted: postToDelete,
    });
    return postToDelete;
};
const singlePost = async (parent, args, context) => {
    return await posts_mongo_1.PostsModel.findById({
        _id: args.postId,
    }).populate("postedBy", "_id username");
};
const totalPosts = async (parent, args, context) => {
    return await posts_mongo_1.PostsModel.find({}).estimatedDocumentCount();
};
const search = async (parent, args) => {
    const { query } = args;
    return await posts_mongo_1.PostsModel.find({
        $text: {
            $search: query,
        },
    }).populate("postedBy", "username");
};
const posts = {
    Query: {
        allPosts,
        postsByUser,
        singlePost,
        totalPosts,
        search,
    },
    Mutation: {
        postCreate,
        postUpdate,
        postDelete,
    },
    Subscription: {
        postAdded: {
            // asyncIterator takes events
            subscribe: () => exports.pubsub.asyncIterator([POST_ADDED]),
        },
        postUpdated: {
            // asyncIterator takes events
            subscribe: () => exports.pubsub.asyncIterator([POST_UPDATED]),
        },
        postDeleted: {
            // asyncIterator takes events
            subscribe: () => exports.pubsub.asyncIterator([POST_DELETED]),
        },
    },
};
exports.default = posts;
// const resolvers = {
//   Subscription: {
//     hello: {
//       // Example using an async generator
//       subscribe: async function* () {
//         for await (const word of ['Hello', 'Bonjour', 'Ciao']) {
//           yield { hello: word };
//         }
//       },
//     },
//     postCreated: {
//       // More on pubsub below
//       subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
//     },
//   },
//   // ...other resolvers...
// };
