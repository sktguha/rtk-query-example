import React, { useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { endpoints, useGetPostQuery } from "../../app/services/posts";
import {
  Box,
  Button,
  Center,
  CloseButton,
  Flex,
  Heading,
  Input,
  Spacer,
  Stack
} from "@chakra-ui/react";
import { connect, ConnectedProps } from "react-redux";
import { RootState } from "src/app/store";

const EditablePostName = ({
  name: initialName,
  onUpdate,
  onCancel,
  isLoading = false
}: {
  name: string;
  onUpdate: (name: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  const [name, setName] = useState(initialName);

  const handleChange = ({
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) => setName(value);

  const handleUpdate = () => onUpdate(name);
  const handleCancel = () => onCancel();

  return (
    <Flex>
      <Box flex={10}>
        <Input
          type="text"
          onChange={handleChange}
          value={name}
          disabled={isLoading}
        />
      </Box>
      <Spacer />
      <Box>
        <Stack spacing={4} direction="row" align="center">
          <Button onClick={handleUpdate} isLoading={isLoading}>
            Update
          </Button>
          <CloseButton bg="red" onClick={handleCancel} disabled={isLoading} />
        </Stack>
      </Box>
    </Flex>
  );
};

const PostJsonDetail = ({ id }: { id: number }) => {
  const { data: post } = useGetPostQuery(id);

  return (
    <Box mt={5} bg="#eee">
      <pre>{JSON.stringify(post, null, 2)}</pre>
    </Box>
  );
};

const mapState = (
  state: RootState,
  ownProps: RouteComponentProps<{ id: string }>
) => ({
  id: Number(ownProps.match.params.id),
  post: endpoints.getPost.select(Number(ownProps.match.params.id))(state),
  updatePostState: endpoints.updatePost.select(ownProps.match.params.id)(state), // TODO: make selectors work with the requestId of the mutation?
  deletePostState: endpoints.updatePost.select(ownProps.match.params.id)(state)
});

const mapDispatch = {
  getPost: endpoints.getPost.initiate,
  updatePost: endpoints.updatePost.initiate,
  deletePost: endpoints.deletePost.initiate
};

const connector = connect(mapState, mapDispatch);
type PostDetailProps = ConnectedProps<typeof connector> & RouteComponentProps;

export class PostDetailComp extends React.Component<PostDetailProps> {
  state = {
    isEditing: false
  };

  componentDidMount() {
    const { id, getPost } = this.props;
    getPost(id);
  }

  componentDidUpdate(prevProps: PostDetailProps) {
    const { id, getPost } = this.props;
    if (id !== prevProps.id) {
      getPost(id);
    }
  }

  render() {
    const { isEditing } = this.state;
    const {
      // state
      id,
      post: { data: post, isLoading: isPostLoading },
      updatePostState: { isLoading: isUpdateLoading },
      deletePostState: { isLoading: isDeleteLoading },

      // actions
      updatePost,
      deletePost
    } = this.props;

    // simulate behavior from the hook
    if (isPostLoading && !post) {
      return <div>Loading...</div>;
    }

    if (!post) {
      return (
        <Center h="200px">
          <Heading size="md">
            Post {id} is missing! Try reloading or selecting another post...
          </Heading>
        </Center>
      );
    }

    return (
      <Box p={4}>
        {isEditing ? (
          <EditablePostName
            name={post.name}
            onUpdate={(name) =>
              updatePost({ id, name }, { track: true })
                .then((result) => {
                  // handle the success!
                  console.log("Update Result", result);
                  this.setState({ isEditing: false });
                })
                .catch((error) => console.error("Update Error", error))
            }
            onCancel={() => this.setState({ isEditing: false })}
            isLoading={isUpdateLoading}
          />
        ) : (
          <Flex>
            <Box>
              <Heading size="md">{post.name}</Heading>
            </Box>
            <Spacer />
            <Box>
              <Stack spacing={4} direction="row" align="center">
                <Button
                  onClick={() => this.setState({ isEditing: true })}
                  disabled={isDeleteLoading || isUpdateLoading}
                >
                  {isUpdateLoading ? "Updating..." : "Edit"}
                </Button>
                <Button
                  onClick={() =>
                    deletePost(id).then(() => this.props.history.push("/posts"))
                  }
                  disabled={isDeleteLoading}
                  colorScheme="red"
                >
                  {isDeleteLoading ? "Deleting..." : "Delete"}
                </Button>
              </Stack>
            </Box>
          </Flex>
        )}
        <PostJsonDetail id={id} />
      </Box>
    );
  }
}

export const PostDetail = connector(PostDetailComp);
