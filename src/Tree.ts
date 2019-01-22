import { Tree, TreeNode, Dict, PossibleList, StackObject } from './types';
import { performIntersections } from './intersections';

export default function Branch(value: any, left: Tree, right: Tree): TreeNode {
  return { value, left, right };
}

export function evalTree(
  tree: TreeNode,
  index: Dict,
  operatorsDict: Dict
): PossibleList {
  if (tree.left === null && tree.right === null) {
    return index[tree.value];
  } else {
    return performIntersections(
      evalTree(tree.left as TreeNode, index, operatorsDict),
      evalTree(tree.right as TreeNode, index, operatorsDict),
      tree.value
    );
  }
}

export function addBranch(
  stack: StackObject,
  symbol: string,
  isRight: boolean
): StackObject {
  if (isRight) {
    const left = stack.pop();

    return stack.push(Branch(symbol, left, null as Tree));
  } else {
    const right = stack.pop();
    const left = stack.pop();

    return stack.push(Branch(symbol, left, right));
  }
}
